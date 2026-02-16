
import { db } from '../db';
import { LedgerService } from './LedgerService';
import { SnapshotService } from './SnapshotService';
import { MigrationV2 } from '../utils/MigrationV2';
import { InventorySyncManager } from './InventorySyncManager';
import { InventoryExportService } from './InventoryExportService';
import { InventoryAuditService } from './InventoryAuditService';
import { LogService } from './LogService';
import { seedDatabase } from './DatabaseSeeder';
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

// Validation Helper
const validateItemPayload = (item: Partial<InventoryItem>) => {
    if (!item.name?.trim()) throw new Error("Nome do produto é obrigatório.");
    if (!item.baseUnit?.trim()) throw new Error("Unidade de medida é obrigatória.");
    if ((item.quantity ?? 0) < 0) throw new Error("Quantidade não pode ser negativa.");
    if (!item.category?.trim()) throw new Error("Categoria é obrigatória.");
};

/**
 * InventoryService Core Logic
 * Refactored to follow SRP. Delegates Sync, Audit, and Export to specialized services.
 */
export const InventoryService = {
  
  // --- Initialization / Sync ---

  async initialize() {
      // Auto-migrate on startup if needed
      await MigrationV2.runMigration();
      // Purge old logs (keep last 30 days)
      await LogService.purgeOldLogs(30);
  },
  
  async syncFromCloud(): Promise<void> {
      return InventorySyncManager.syncFromCloud();
  },

  // --- Read Operations ---
  
  async getAllItems(): Promise<InventoryItem[]> {
    return await db.items.toArray();
  },

  async getHistory(): Promise<MovementRecord[]> {
    const history = await db.history.toArray();
    // Optimization: Use string comparison for ISO dates to avoid expensive Date object creation
    return history.sort((a, b) => (b.date > a.date ? 1 : -1));
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
      const cleanCode = code.trim();

      // 1. Try Direct ID Lookup (Fastest - Primary Key)
      let item = await db.items.get(cleanCode);
      if (item) return item;

      // 2. Try Exact SAP Code (Indexed)
      item = await db.rawDb.items.where('sapCode').equals(cleanCode).first();
      if (item) return item;

      // 3. Try Exact Lot Number (Indexed)
      item = await db.rawDb.items.where('lotNumber').equals(cleanCode).first();
      if (item) return item;
      
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

      const batchMap = new Map(batches.map(b => [b.id, b]));
      const results: BatchDetailView[] = [];
      for (const bal of balances) {
          const batch = batchMap.get(bal.batchId);
          if (batch && bal.quantity > 0) {
              results.push({
                  batchId: batch.id,
                  lotNumber: batch.lotNumber,
                  expiryDate: batch.expiryDate || "",
                  quantity: bal.quantity,
                  locationName: locMap.get(bal.locationId) || "Local Desconhecido",
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
    
    let historyRecord: MovementRecord | null = null;

    try {
        // GLOBAL ATOMIC TRANSACTION
        // Wraps Ledger (V2), Snapshot (V1), and History (Legacy) updates in a single failure domain.
        await db.transaction('rw', [
            db.rawDb.items,
            db.rawDb.history,
            db.rawDb.stock_movements,
            db.rawDb.balances,
            db.rawDb.batches,
            db.rawDb.catalog,
            db.rawDb.storage_locations
        ], async () => {
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
            historyRecord = {
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
        });
    } catch (e) {
        db.invalidateCaches(); // Invalidate L1 cache on transaction failure
        throw e;
    }

    // 4. Cloud Sync (Outside transaction)
    if (historyRecord) {
        const syncPayload = {
            movements: [historyRecord]
        };
        InventorySyncManager.notifyChange('sync_transaction', syncPayload);
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
    
    InventorySyncManager.notifyItemChange(updatedItem);
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
        // ATOMIC WRITE ALL (Includes stock_movements for Ledger)
        await db.transaction('rw', [db.rawDb.items, db.rawDb.catalog, db.rawDb.batches, db.rawDb.history, db.rawDb.balances, db.rawDb.stock_movements], async () => {
            await db.items.add(newItem);
            await db.rawDb.catalog.put(catalog); 
            await db.rawDb.batches.put(batch);
            
            if (newItem.quantity > 0) {
                // Use LedgerService for robust stock entry (V2)
                const movement = await LedgerService.registerMovement({
                    batchId: batchId,
                    type: 'ENTRADA',
                    quantity: newItem.quantity,
                    toLocationId: locId,
                    userId: 'SYSTEM',
                    observation: 'Cadastro Inicial',
                    date: now
                });

                // Maintain V1 History for UI compatibility
                history = {
                    id: movement.id,
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
            } else {
                // Zero stock: Just create the empty balance record manually to initialize it
                await db.rawDb.balances.put(balance);
            }
        });
      } catch (e) {
        db.invalidateCaches();
        throw e;
      }

      const syncPayload = {
          catalog: [catalog],
          batches: [batch],
          balances: [balance],
          movements: history ? [history] : []
      };

      InventorySyncManager.notifyChange('sync_transaction', syncPayload);
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
      
      InventorySyncManager.notifyItemChange(updatedItem);
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
      
      InventorySyncManager.notifyItemDelete(id);
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

      ids.forEach(id => {
          InventorySyncManager.notifyItemDelete(id);
      });
  },
  
  // Audits consistency between V1 (UI) and V2 (Ledger)
  async runLedgerAudit(fix: boolean = false) {
      return InventoryAuditService.runLedgerAudit(fix);
  },

  async replaceDatabaseWithData(data: any): Promise<void> {
      await seedDatabase(true, data);
  },
  
  async exportData(options: ExportOptions) {
      const items = await this.getAllItems();
      await InventoryExportService.exportData(items, () => this.getHistory(), options);
  }
};
