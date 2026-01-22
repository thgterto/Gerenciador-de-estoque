
import { db } from '../db';
import { GoogleSheetsService } from './GoogleSheetsService';
import { SyncQueueService } from './SyncQueueService';
import { LedgerService } from './LedgerService';   // NEW
import { SnapshotService } from './SnapshotService'; // NEW
import { MigrationV2 } from '../utils/MigrationV2'; // NEW
import { 
    InventoryItem, 
    MovementRecord, 
    CreateItemDTO, 
    StockTransactionDTO,
    ExportOptions,
    StorageLocationEntity,
    StockBalance,
    InventoryBatch,
    CatalogProduct,
    BatchDetailView
} from '../types';
import { generateInventoryId, sanitizeProductName, normalizeUnit, generateHash } from '../utils/stringUtils';
import { ExportEngine } from '../utils/ExportEngine';

// Validation Helper
const validateItemPayload = (item: Partial<InventoryItem>) => {
    if (!item.name?.trim()) throw new Error("Nome do produto é obrigatório.");
    if (!item.baseUnit?.trim()) throw new Error("Unidade de medida é obrigatória.");
    if ((item.quantity ?? 0) < 0) throw new Error("Quantidade não pode ser negativa.");
    if (!item.category?.trim()) throw new Error("Categoria é obrigatória.");
};

/**
 * InventoryService Core Logic
 * NOW UPDATED: Uses LedgerService as the Single Source of Truth.
 */
export const InventoryService = {
  
  // --- Initialization / Sync ---

  async initialize() {
      // Auto-migrate on startup if needed
      await MigrationV2.runMigration();
  },
  
  async syncFromCloud(): Promise<void> {
      try {
          if (!GoogleSheetsService.isConfigured()) {
              console.log("Modo Offline: Google Sheets não configurado.");
              return;
          }

          // Check for pending offline changes to prevent overwrite
          const pendingCount = await SyncQueueService.getQueueSize();
          if (pendingCount > 0) {
              console.warn(`[Sync] Aborted: ${pendingCount} offline changes pending. Triggering push first.`);
              SyncQueueService.triggerProcess();
              return;
          }

          console.log("Iniciando sincronização V2 (Smart Merge)...");
          const { view, catalog, batches, balances } = await GoogleSheetsService.fetchFullDatabase();
          
          if (view.length > 0) {
              // Atomic Transaction
              await db.transaction('rw', [db.rawDb.items, db.rawDb.catalog, db.rawDb.batches, db.rawDb.balances], async () => {
                  await Promise.all([
                      db.items.bulkPut(view),
                      db.rawDb.catalog.bulkPut(catalog),
                      db.rawDb.batches.bulkPut(batches),
                      db.rawDb.balances.bulkPut(balances)
                  ]);
              });
              console.log(`Sync Concluído: ${view.length} items atualizados.`);
          }
      } catch (error) {
          console.error("Erro na sincronização Cloud:", error);
          // Invalidate cache on sync error to ensure consistency
          db.invalidateCaches();
      }
  },

  // --- Read Operations ---
  
  async getAllItems(): Promise<InventoryItem[]> {
    return await db.items.toArray();
  },

  async getHistory(): Promise<MovementRecord[]> {
    const history = await db.history.toArray();
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getDashboardMetrics() {
    const items = await this.getAllItems();
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    const expiring = items.filter(i => i.expiryDate && new Date(i.expiryDate) < next30Days).length;
    const lowStock = items.filter(i => i.quantity <= i.minStockLevel && i.minStockLevel > 0).length;
    
    return {
      totalItems: items.length,
      alertsCount: expiring + lowStock,
      expiringCount: expiring,
      lowStockCount: lowStock
    };
  },

  async findItemByCode(code: string): Promise<InventoryItem | null> {
      const items = await this.getAllItems();
      const search = code.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      
      const exactMatch = items.find(i => 
          i.id === code || 
          (i.sapCode && i.sapCode.toLowerCase().replace(/[^a-z0-9]/g, "") === search) || 
          (i.lotNumber && i.lotNumber.toLowerCase().replace(/[^a-z0-9]/g, "") === search)
      );
      if (exactMatch) return exactMatch;
      return null;
  },

  async getItemBatchDetails(itemId: string): Promise<BatchDetailView[]> {
      const item = await db.items.get(itemId);
      if (!item || !item.catalogId) return [];

      const batches = await db.rawDb.batches.where('catalogId').equals(item.catalogId).toArray() as InventoryBatch[];
      if (batches.length === 0) return [];

      const batchIds = batches.map(b => b.id);
      const balances = await db.rawDb.balances.where('batchId').anyOf(batchIds).toArray() as StockBalance[];
      const locIds = [...new Set(balances.map(b => b.locationId))];
      const locations = await db.rawDb.storage_locations.bulkGet(locIds) as (StorageLocationEntity | undefined)[];
      const locMap = new Map((locations.filter(Boolean) as StorageLocationEntity[]).map(l => [l.id, l.name])); 

      const results: BatchDetailView[] = [];
      for (const bal of balances) {
          const batch = batches.find(b => b.id === bal.batchId);
          if (batch && bal.quantity > 0) {
              results.push({
                  batchId: batch.id,
                  lotNumber: batch.lotNumber,
                  expiryDate: batch.expiryDate || '',
                  quantity: bal.quantity,
                  locationName: locMap.get(bal.locationId) || 'Local Desconhecido',
                  status: batch.status
              });
          }
      }

      return results.sort((a, b) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
  },

  // --- Transactional Operations (Ledger V2) ---

  async processTransaction(payload: StockTransactionDTO): Promise<void> {
    const { itemId, type, quantity, date, observation, fromLocationId, toLocationId } = payload;

    if (quantity < 0) throw new Error("A quantidade não pode ser negativa.");

    const item = await db.items.get(itemId);
    if (!item) throw new Error("Item não encontrado no inventário.");

    // Resolve IDs
    const batchId = item.batchId || `BAT-${itemId}`;
    const mainLocId = item.locationId || `LOC-${generateHash(item.location.warehouse || 'Geral')}`;

    // Determine effective Source/Dest locations & Delta for Ledger
    let effectiveFrom = fromLocationId;
    let effectiveTo = toLocationId;
    let ledgerQuantity = quantity;

    if (type === 'SAIDA' && !effectiveFrom) effectiveFrom = mainLocId;
    if (type === 'ENTRADA' && !effectiveTo) effectiveTo = mainLocId;

    if (type === 'TRANSFERENCIA') {
        if (!effectiveFrom) effectiveFrom = mainLocId;
        // toLocationId is required for transfer
    }

    // Fix for AJUSTE: The UI sends the "Target Total Quantity", but Ledger expects a "Delta".
    if (type === 'AJUSTE') {
        // Fetch authoritative balance from V2 Ledger for accuracy (V1 might be stale)
        const currentBalance = await db.rawDb.balances
            .where({ batchId: batchId, locationId: mainLocId })
            .first();

        const currentQty = currentBalance ? currentBalance.quantity : 0;
        const diff = quantity - currentQty;

        ledgerQuantity = Math.abs(diff);

        if (diff > 0) {
            // Gain: Treat like Entry
            effectiveTo = mainLocId;
            effectiveFrom = undefined;
        } else if (diff < 0) {
            // Loss: Treat like Exit
            effectiveFrom = mainLocId;
            effectiveTo = undefined;
        } else {
            // No change
            return;
        }
    }
    
    // 1. EXECUTE LEDGER TRANSACTION (Atomic)
    // This throws if stock is insufficient or invalid.
    const movement = await LedgerService.registerMovement({
        batchId,
        type,
        quantity: ledgerQuantity,
        fromLocationId: effectiveFrom,
        toLocationId: effectiveTo,
        userId: payload.userId || 'USER',
        observation: observation,
        date: date
    });

    // 2. ASYNC SNAPSHOT UPDATE (The "Worker")
    // Re-calculates the V1 Item View based on the new Ledger State
    await SnapshotService.updateItemSnapshot(batchId);

    // 3. Legacy Audit Trail (Keep 'history' table for existing UI charts/grids)
    // We duplicate this logic briefly to support the old chart view until it's refactored
    const historyRecord: MovementRecord = {
        id: movement.id,
        itemId: item.id,
        date: movement.createdAt,
        type: type,
        batchId: batchId,
        fromLocationId: movement.fromLocationId,
        toLocationId: movement.toLocationId,
        productName: item.name,
        sapCode: item.sapCode,
        lot: item.lotNumber,
        quantity: quantity,
        unit: item.baseUnit,
        location_warehouse: item.location.warehouse,
        supplier: item.supplier,
        observation: observation || ''
    };
    await db.history.add(historyRecord);

    // 4. Cloud Sync
    if (GoogleSheetsService.isConfigured()) {
        // We sync the raw movement + the updated balance (fetched fresh)
        // Ideally we fetch the specific balance changed, but for now we sync movement.
        const payload = {
            movements: [historyRecord]
        };

        GoogleSheetsService.request('sync_transaction', payload)
            .catch(() => SyncQueueService.enqueue('sync_transaction', payload));
    }
  },

  async registerMovement(item: InventoryItem, type: 'ENTRADA'|'SAIDA'|'AJUSTE', quantity: number, date: string, obs: string) {
      return this.processTransaction({
          itemId: item.id,
          type,
          quantity,
          date,
          observation: obs
      });
  },

  async updateItemPosition(itemId: string, newPosition: string): Promise<void> {
    const item = await db.items.get(itemId);
    if (!item) throw new Error("Item não encontrado.");

    const updatedItem = {
        ...item,
        location: { ...item.location, position: newPosition },
        lastUpdated: new Date().toISOString()
    };

    try {
        await db.transaction('rw', [db.rawDb.items], async () => {
            await db.items.put(updatedItem);
        });
    } catch (e) {
        db.invalidateCaches();
        throw e;
    }
    
    if (GoogleSheetsService.isConfigured()) {
        GoogleSheetsService.addOrUpdateItem(updatedItem)
            .catch(() => SyncQueueService.enqueue('upsert_item', { item: updatedItem }));
    }
  },

  async addItem(dto: CreateItemDTO): Promise<void> {
      validateItemPayload(dto);
      
      const newId = generateInventoryId(dto.sapCode || '', dto.name, dto.lotNumber);
      const now = new Date().toISOString();
      const catalogId = `CAT-${generateInventoryId(dto.sapCode || '', dto.name, '')}`;
      const batchId = `BAT-${newId}`;
      const locId = `LOC-${generateHash(dto.location.warehouse || 'Geral')}`;
      const balanceId = `BAL-${generateHash(batchId + locId)}`;
      
      const newItem: InventoryItem = {
          id: newId,
          name: sanitizeProductName(dto.name || 'Novo Item'),
          sapCode: dto.sapCode || 'S/ SAP',
          lotNumber: dto.lotNumber || 'GEN',
          quantity: dto.quantity || 0,
          baseUnit: normalizeUnit(dto.baseUnit || 'UN'),
          category: dto.category || 'Geral',
          minStockLevel: dto.minStockLevel || 0,
          location: dto.location || { warehouse: 'Geral', cabinet: '', shelf: '', position: '' },
          risks: dto.risks || { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false },
          itemStatus: 'Ativo',
          type: 'ROH',
          materialGroup: 'Geral',
          isControlled: false,
          expiryDate: dto.expiryDate || '',
          dateAcquired: now,
          lastUpdated: now,
          supplier: dto.supplier || '',
          unitCost: 0,
          currency: 'BRL',
          casNumber: dto.casNumber,
          molecularFormula: dto.molecularFormula,
          molecularWeight: dto.molecularWeight,
          itemType: dto.itemType || 'REAGENT',
          // Key Links
          batchId: batchId,
          catalogId: catalogId
      };

      const catalog: CatalogProduct = {
          id: catalogId,
          sapCode: newItem.sapCode,
          name: newItem.name,
          categoryId: newItem.category,
          baseUnit: newItem.baseUnit,
          casNumber: newItem.casNumber,
          molecularFormula: newItem.molecularFormula,
          molecularWeight: newItem.molecularWeight,
          risks: newItem.risks,
          isControlled: newItem.isControlled,
          minStockLevel: newItem.minStockLevel,
          isActive: true
      };

      const batch: InventoryBatch = {
          id: batchId,
          catalogId: catalogId,
          lotNumber: newItem.lotNumber,
          expiryDate: newItem.expiryDate,
          partnerId: '', 
          status: 'ACTIVE',
          unitCost: newItem.unitCost
      };

      const balance: StockBalance = {
          id: balanceId,
          batchId: batchId,
          locationId: locId,
          quantity: newItem.quantity,
          lastMovementAt: now
      };

      let history: MovementRecord | null = null;

      try {
        // ATOMIC WRITE ALL
        await db.transaction('rw', [db.rawDb.items, db.rawDb.catalog, db.rawDb.batches, db.rawDb.history, db.rawDb.balances], async () => {
            await db.items.add(newItem);
            await db.rawDb.catalog.put(catalog); 
            await db.rawDb.batches.put(batch);
            await db.rawDb.balances.put(balance);
            
            if (newItem.quantity > 0) {
                history = {
                    id: crypto.randomUUID(),
                    itemId: newId,
                    date: now,
                    type: 'ENTRADA' as const,
                    quantity: newItem.quantity,
                    unit: newItem.baseUnit,
                    productName: newItem.name,
                    sapCode: newItem.sapCode,
                    lot: newItem.lotNumber,
                    location_warehouse: newItem.location.warehouse,
                    observation: 'Cadastro Inicial',
                    batchId: batchId
                };
                await db.history.add(history);
            }
        });
      } catch (e) {
        db.invalidateCaches();
        throw e;
      }

      if (GoogleSheetsService.isConfigured()) {
          const payload = {
              catalog: [catalog],
              batches: [batch],
              balances: [balance],
              movements: history ? [history] : []
          };
          
          GoogleSheetsService.request('sync_transaction', payload)
              .catch(() => SyncQueueService.enqueue('sync_transaction', payload));
      }
  },

  async updateItem(item: InventoryItem): Promise<void> {
      validateItemPayload(item);
      const now = new Date().toISOString();
      const updatedItem = { ...item, lastUpdated: now };

      try {
        await db.transaction('rw', [db.rawDb.items, db.rawDb.catalog, db.rawDb.batches], async () => {
            // 1. Update Snapshot
            await db.items.put(updatedItem);

            // 2. Cascade Update to Catalog (If product definition changed)
            if (item.catalogId) {
                const catalogEntry = await db.rawDb.catalog.get(item.catalogId);
                // Only update if it exists, don't create orphan catalogs
                if (catalogEntry) {
                    await db.rawDb.catalog.put({
                        ...catalogEntry,
                        name: item.name,
                        sapCode: item.sapCode,
                        categoryId: item.category,
                        baseUnit: item.baseUnit,
                        casNumber: item.casNumber,
                        molecularFormula: item.molecularFormula,
                        risks: item.risks,
                        minStockLevel: item.minStockLevel,
                        updatedAt: now
                    });
                } else {
                    // If catalog missing (legacy data), create it now for integrity
                    const newCatalog: CatalogProduct = {
                        id: item.catalogId,
                        name: item.name,
                        sapCode: item.sapCode,
                        categoryId: item.category,
                        baseUnit: item.baseUnit,
                        risks: item.risks,
                        isControlled: item.isControlled,
                        minStockLevel: item.minStockLevel,
                        isActive: true
                    };
                    await db.rawDb.catalog.put(newCatalog);
                }
            }

            // 3. Cascade Update to Batch (If lot details changed)
            if (item.batchId) {
                const batchEntry = await db.rawDb.batches.get(item.batchId);
                if (batchEntry) {
                    await db.rawDb.batches.put({
                        ...batchEntry,
                        lotNumber: item.lotNumber,
                        expiryDate: item.expiryDate,
                        updatedAt: now
                    });
                } else {
                    // Defensive Upsert
                    await db.rawDb.batches.put({
                        id: item.batchId,
                        catalogId: item.catalogId || `CAT-${generateInventoryId(item.sapCode, item.name, '')}`,
                        lotNumber: item.lotNumber,
                        expiryDate: item.expiryDate,
                        status: 'ACTIVE',
                        unitCost: item.unitCost
                    });
                }
            }
        });
      } catch (e) {
        db.invalidateCaches();
        throw e;
      }
      
      if (GoogleSheetsService.isConfigured()) {
          GoogleSheetsService.addOrUpdateItem(updatedItem)
              .catch(() => SyncQueueService.enqueue('upsert_item', { item: updatedItem }));
      }
  },

  async deleteItem(id: string): Promise<void> {
      const itemToDelete = await db.items.get(id);

      try {
        await db.transaction('rw', [db.rawDb.items, db.rawDb.balances, db.rawDb.batches], async () => {
            await db.items.delete(id);

            if (itemToDelete && itemToDelete.batchId) {
               const balances = await db.rawDb.balances.where('batchId').equals(itemToDelete.batchId).toArray();
               const balanceIds = balances.map((b: any) => b.id);
               await db.rawDb.balances.bulkDelete(balanceIds);
            }
        });
      } catch (e) {
        db.invalidateCaches();
        throw e;
      }
      
      if (GoogleSheetsService.isConfigured()) {
          GoogleSheetsService.deleteItem(id)
             .catch(() => SyncQueueService.enqueue('delete_item', { id }));
      }
  },

  async deleteBulk(ids: string[]): Promise<void> {
      try {
        await db.transaction('rw', [db.rawDb.items, db.rawDb.balances], async () => {
            const items = await db.items.bulkGet(ids);
            const batchIds = items.filter(i => i && i.batchId).map(i => i!.batchId!);
            
            await db.items.bulkDelete(ids);
            
            if (batchIds.length > 0) {
                const balances = await db.rawDb.balances.where('batchId').anyOf(batchIds).toArray();
                const balanceIds = balances.map((b: any) => b.id);
                await db.rawDb.balances.bulkDelete(balanceIds);
            }
        });
      } catch (e) {
        db.invalidateCaches();
        throw e;
      }

      if (GoogleSheetsService.isConfigured()) {
          ids.forEach(id => {
              GoogleSheetsService.deleteItem(id)
                .catch(() => SyncQueueService.enqueue('delete_item', { id }));
          });
      }
  },
  
  // Audits consistency between V1 (UI) and V2 (Ledger)
  async runLedgerAudit(fix: boolean = false) {
      const items = await db.items.toArray();
      const balances = await db.rawDb.balances.toArray() as StockBalance[];
      const batches = await db.rawDb.batches.toArray() as InventoryBatch[];
      
      let matches = 0;
      let mismatches = 0;
      let corrections = 0;
      
      const batchMap = new Map(batches.map((b: InventoryBatch) => [b.id, b]));
      
      // Sum up ledger by Catalog (Product ID)
      const ledgerSums = new Map<string, number>();
      
      balances.forEach((bal: StockBalance) => {
          const batch = batchMap.get(bal.batchId);
          if (batch && batch.catalogId) {
             const current = ledgerSums.get(batch.id) || 0; // Use Batch ID
             ledgerSums.set(batch.id, current + bal.quantity);
          }
      });

      const updates: InventoryItem[] = [];

      for (const item of items) {
          const batchId = item.batchId || `BAT-${item.id}`;
          const ledgerQty = ledgerSums.get(batchId);
          
          if (ledgerQty !== undefined) {
              // Floating point tolerance
              if (Math.abs(ledgerQty - item.quantity) > 0.001) {
                  mismatches++;
                  if (fix) {
                      updates.push({ ...item, quantity: parseFloat(ledgerQty.toFixed(3)) });
                      corrections++;
                  }
              } else {
                  matches++;
              }
          } else {
               // Item exists in V1 but no balance in V2 (Drift)
               if (item.quantity > 0) {
                   mismatches++;
                   if (fix) {
                       updates.push({ ...item, quantity: 0 });
                       corrections++;
                   }
               }
          }
      }

      if (fix && updates.length > 0) {
          await db.items.bulkPut(updates);
      }

      return { matches, mismatches, corrections };
  },

  async replaceDatabaseWithData(data: any): Promise<void> {
      const { seedDatabase } = await import('./DatabaseSeeder');
      await seedDatabase(true, data);
  },
  
  async exportData(options: ExportOptions) {
      const sheets = [];
      const items = await this.getAllItems();
      sheets.push({ name: 'Inventario', data: ExportEngine.prepareInventoryData(items) });
      if (options.includeHistory) {
          const history = await this.getHistory();
          sheets.push({ name: 'Historico', data: ExportEngine.prepareHistoryData(history) });
      }
      const filename = `LabControl_Export_${new Date().toISOString().split('T')[0]}`;
      ExportEngine.generateExcel(sheets, filename);
  }
};
