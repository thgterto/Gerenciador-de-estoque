import { db } from '../db';
import { GoogleSheetsService } from './GoogleSheetsService';
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
    BusinessPartner,
    RiskFlags
} from '../types';
import { CasApiService } from './CasApiService';
import { generateInventoryId, sanitizeProductName, normalizeUnit } from '../utils/stringUtils';
import { ExportEngine } from '../utils/ExportEngine';

export interface BatchDetailView {
    batchId: string;
    lotNumber: string;
    expiryDate: string;
    quantity: number;
    locationName: string;
    status: string;
}

// Validation Helper
const validateItemPayload = (item: Partial<InventoryItem>) => {
    if (!item.name?.trim()) throw new Error("Nome do produto é obrigatório.");
    if (!item.baseUnit?.trim()) throw new Error("Unidade de medida é obrigatória.");
    if ((item.quantity ?? 0) < 0) throw new Error("Quantidade não pode ser negativa.");
    if (!item.category?.trim()) throw new Error("Categoria é obrigatória.");
};

// --- Helper de Normalização (V1 -> V2) ---
const normalizeData = (items: InventoryItem[]) => {
    const catalogMap = new Map<string, CatalogProduct>();
    const partnerMap = new Map<string, BusinessPartner>();
    const locationMap = new Map<string, StorageLocationEntity>();
    const batches: InventoryBatch[] = [];
    const balances: StockBalance[] = [];

    items.forEach(item => {
        // 1. Catalog (Definição do Produto)
        const catalogId = item.catalogId || `CAT-${generateInventoryId(item.sapCode, item.name, '')}`; 
        if (!catalogMap.has(catalogId)) {
            catalogMap.set(catalogId, {
                id: catalogId, 
                sapCode: item.sapCode, 
                name: item.name, 
                categoryId: item.category, 
                baseUnit: item.baseUnit,
                casNumber: item.casNumber,
                molecularFormula: item.molecularFormula,
                molecularWeight: item.molecularWeight,
                risks: item.risks, 
                isControlled: item.isControlled, 
                minStockLevel: item.minStockLevel,
                isActive: true,
                createdAt: new Date().toISOString(),
                // Dynamic Fields
                itemType: item.itemType,
                glassVolume: item.glassVolume,
                glassMaterial: item.glassMaterial
            });
        }

        // 2. Partner (Fornecedor)
        const supplierName = item.supplier?.trim() || 'Genérico';
        const partnerId = `PRT-${sanitizeProductName(supplierName).replace(/\s+/g, '-')}`;
        if (!partnerMap.has(partnerId)) {
            partnerMap.set(partnerId, { id: partnerId, name: supplierName, type: 'SUPPLIER', active: true });
        }

        // 3. Location (Localização)
        const locStr = `${item.location.warehouse} ${item.location.cabinet || ''}`.trim() || 'Geral';
        const locId = `LOC-${sanitizeProductName(locStr).replace(/\s+/g, '-')}`;
        if (!locationMap.has(locId)) {
            locationMap.set(locId, { id: locId, name: locStr, type: 'CABINET', pathString: locStr });
        }
        
        // 4. Batch (Lote Físico)
        const batchId = item.batchId || `BAT-${item.id}`;
        
        batches.push({
            id: batchId, 
            catalogId: catalogId, 
            partnerId: partnerId, 
            lotNumber: item.lotNumber,
            unitCost: item.unitCost, 
            expiryDate: item.expiryDate, 
            status: item.itemStatus === 'Ativo' ? 'ACTIVE' : 'BLOCKED', 
            createdAt: new Date().toISOString()
        });

        // 5. Balance (Saldo no Local)
        balances.push({
            id: crypto.randomUUID(), 
            batchId: batchId, 
            locationId: locId, 
            quantity: item.quantity,
            lastMovementAt: new Date().toISOString()
        });
    });

    return { 
        catalog: Array.from(catalogMap.values()), 
        partners: Array.from(partnerMap.values()), 
        locations: Array.from(locationMap.values()), 
        batches, 
        balances 
    };
};

export const InventoryService = {
  
  // --- Initialization / Sync ---
  
  async syncFromCloud(): Promise<void> {
      try {
          try {
              GoogleSheetsService.getUrl();
          } catch {
              console.log("Modo Offline: Google Sheets não configurado.");
              return;
          }

          console.log("Iniciando sincronização V2 (Smart Merge)...");
          const { view, catalog, batches, balances } = await GoogleSheetsService.fetchFullDatabase();
          
          if (view.length > 0) {
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

  // --- Transactional Operations (3NF Compliance + Atomic Dual-Write) ---

  async processTransaction(payload: StockTransactionDTO): Promise<void> {
    const { itemId, type, quantity, date, observation, fromLocationId, toLocationId } = payload;

    if (quantity < 0) throw new Error("A quantidade não pode ser negativa.");

    let updatedBalance: StockBalance | null = null;
    let newHistory: MovementRecord | null = null;

    await db.transaction('rw', [db.rawDb.items, db.rawDb.history, db.rawDb.balances], async () => {
        // Read directly from DB to ensure lock and fresh data
        const item = await db.rawDb.items.get(itemId);
        if (!item) throw new Error("Item não encontrado no inventário.");

        let newBalance = item.quantity;
        let deltaQty = 0;

        if (type === 'ENTRADA') {
            newBalance = item.quantity + quantity;
            deltaQty = quantity;
        }
        else if (type === 'SAIDA') {
            if (quantity > item.quantity) {
                throw new Error(`Saldo insuficiente. Disponível: ${item.quantity} ${item.baseUnit}`);
            }
            newBalance = item.quantity - quantity;
            deltaQty = quantity;
        }
        else if (type === 'AJUSTE') {
            const diff = quantity - item.quantity;
            newBalance = quantity;
            deltaQty = Math.abs(diff);
        }
        else if (type === 'TRANSFERENCIA') {
            deltaQty = quantity;
        }

        const updatedItem: InventoryItem = {
            ...item,
            quantity: parseFloat(newBalance.toFixed(3)),
            lastUpdated: new Date().toISOString()
        };

        const batchId = item.batchId || `BAT-${itemId}`;
        const mainLocId = item.locationId || item.location.warehouse || `LOC-DEFAULT`;

        newHistory = {
            id: crypto.randomUUID(),
            itemId: item.id,
            date: date,
            type: type,
            batchId: batchId,
            fromLocationId: fromLocationId || (type === 'SAIDA' ? mainLocId : undefined),
            toLocationId: toLocationId || (type === 'ENTRADA' ? mainLocId : undefined),
            productName: item.name,
            sapCode: item.sapCode,
            lot: item.lotNumber,
            quantity: parseFloat(deltaQty.toFixed(3)),
            unit: item.baseUnit,
            location_warehouse: item.location.warehouse,
            supplier: item.supplier,
            observation: observation || (type === 'AJUSTE' ? 'Correção manual' : ''),
        };

        // Update DB
        await db.items.put(updatedItem); // Hybrid wrapper updates memory cache too
        await db.history.add(newHistory);

        if (type !== 'AJUSTE') { 
            const targetLoc = toLocationId || mainLocId;
            const balanceKey = await db.rawDb.balances
                .where({ batchId: batchId, locationId: targetLoc })
                .first();
            
            let currentLocQty = balanceKey ? balanceKey.quantity : 0;
            
            if (type === 'ENTRADA') currentLocQty += quantity;
            else if (type === 'SAIDA') currentLocQty -= quantity;
            
            updatedBalance = {
                id: balanceKey?.id || crypto.randomUUID(),
                batchId: batchId,
                locationId: targetLoc,
                quantity: Math.max(0, currentLocQty),
                lastMovementAt: new Date().toISOString()
            };
            
            await db.balances.put(updatedBalance);
        }
    });

    if (newHistory) {
        GoogleSheetsService.request('sync_transaction', {
            balances: updatedBalance ? [updatedBalance] : [],
            movements: [newHistory]
        }).catch(e => {
            console.error("Sheets Sync Transaction failed", e);
        });
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

    await db.transaction('rw', [db.rawDb.items, db.rawDb.history], async () => {
        await db.items.put(updatedItem);
    });
    
    GoogleSheetsService.addOrUpdateItem(updatedItem).catch(e => console.error(e));
  },

  async addItem(dto: CreateItemDTO): Promise<void> {
      validateItemPayload(dto);
      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const catalogId = `CAT-${newId}`;
      const batchId = `BAT-${newId}`;
      const balanceId = `BAL-${newId}`;
      
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
          locationId: newItem.location.warehouse,
          quantity: newItem.quantity,
          lastMovementAt: now
      };

      let history: MovementRecord | null = null;

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

      GoogleSheetsService.request('sync_transaction', {
          catalog: [catalog],
          batches: [batch],
          balances: [balance],
          movements: history ? [history] : []
      }).catch(e => console.error(e));
  },

  async updateItem(item: InventoryItem): Promise<void> {
      validateItemPayload(item);
      const now = new Date().toISOString();
      const updatedItem = { ...item, lastUpdated: now };

      await db.transaction('rw', [db.rawDb.items], async () => {
          await db.items.put(updatedItem);
      });
      
      GoogleSheetsService.addOrUpdateItem(updatedItem).catch(e => console.error(e));
  },

  async deleteItem(id: string): Promise<void> {
      await db.transaction('rw', [db.rawDb.items, db.rawDb.balances, db.rawDb.batches], async () => {
          const item = await db.rawDb.items.get(id);
          await db.items.delete(id);

          if (item) {
              // Cleanup V2 orphans
              const batchId = item.batchId || `BAT-${id}`;
              const balances = await db.rawDb.balances.where('batchId').equals(batchId).toArray();
              const balanceIds = balances.map(b => b.id);

              if (balanceIds.length > 0) {
                  await db.balances.bulkDelete(balanceIds);
              }

              // Only delete batch if it exists and matches our ID convention (safe check)
              const batch = await db.rawDb.batches.get(batchId);
              if (batch) {
                  await db.rawDb.batches.delete(batchId);
              }
          }
      });
      
      GoogleSheetsService.deleteItem(id).catch(e => console.error(e));
  },

  async deleteBulk(ids: string[]): Promise<void> {
      await db.items.bulkDelete(ids);
      ids.forEach(id => GoogleSheetsService.deleteItem(id).catch(e => console.error(e)));
  },

  async importBulk(newItems: InventoryItem[], replaceMode: boolean = false): Promise<void> {
      // 1. Gera os dados normalizados (V2) a partir da lista plana (V1)
      const v2Data = normalizeData(newItems);

      // 2. Executa a transação atômica
      await db.transaction('rw', [
          db.rawDb.items, 
          db.rawDb.catalog, 
          db.rawDb.batches, 
          db.rawDb.partners, 
          db.rawDb.storage_locations, 
          db.rawDb.balances
      ], async () => {
          
          if (replaceMode) {
              await Promise.all([
                  db.rawDb.items.clear(),
                  db.rawDb.catalog.clear(),
                  db.rawDb.batches.clear(),
                  db.rawDb.partners.clear(),
                  db.rawDb.storage_locations.clear(),
                  db.rawDb.balances.clear()
              ]);
          }

          // Bulk Insert V1
          await db.items.bulkPut(newItems);

          // Bulk Insert V2 (Ledger)
          if (v2Data.catalog.length > 0) await db.rawDb.catalog.bulkPut(v2Data.catalog);
          if (v2Data.batches.length > 0) await db.rawDb.batches.bulkPut(v2Data.batches);
          if (v2Data.partners.length > 0) await db.rawDb.partners.bulkPut(v2Data.partners);
          if (v2Data.locations.length > 0) await db.rawDb.storage_locations.bulkPut(v2Data.locations);
          if (v2Data.balances.length > 0) await db.rawDb.balances.bulkPut(v2Data.balances);
      });

      // Background Sync (Opcional - pode ser pesado)
      // GoogleSheetsService.request('import_dump', { ...v2Data }).catch(() => {});
  },

  async importHistoryBulk(records: MovementRecord[], updateBalance: boolean = true): Promise<void> {
      await db.history.bulkPut(records);
      
      if (updateBalance) {
          // Se precisar recalcular saldos, idealmente chamaria runLedgerAudit, 
          // mas para performance de importação, deixamos como está por enquanto ou
          // implementamos uma lógica de replay.
          // Aqui, assumimos que o InventoryItem já veio com o saldo correto.
      }
      
      for (const rec of records) {
          await GoogleSheetsService.logMovement(rec).catch(() => {});
      }
  },
  
  async runLedgerAudit(fix: boolean = false) {
      const items = await db.items.toArray();
      const balances = await db.rawDb.balances.toArray() as StockBalance[];
      const batches = await db.rawDb.batches.toArray() as InventoryBatch[];
      
      let matches = 0;
      let mismatches = 0;
      let corrections = 0;
      
      const batchMap = new Map(batches.map(b => [b.id, b]));
      
      // Agrupa saldos V2 por CatalogID (Produto)
      const ledgerSums = new Map<string, number>();
      
      balances.forEach(bal => {
          const batch = batchMap.get(bal.batchId);
          if (batch && batch.catalogId) {
             const current = ledgerSums.get(batch.catalogId) || 0;
             ledgerSums.set(batch.catalogId, current + bal.quantity);
          }
      });

      const updates: InventoryItem[] = [];

      for (const item of items) {
          const catalogId = item.catalogId || `CAT-${generateInventoryId(item.sapCode, item.name, '')}`;
          const ledgerQty = ledgerSums.get(catalogId);
          
          // Se não encontrou no ledger (V2), significa que o V1 está "flutuando". 
          // Se encontrou, compara.
          if (ledgerQty !== undefined) {
              if (Math.abs(ledgerQty - item.quantity) > 0.001) {
                  mismatches++;
                  if (fix) {
                      updates.push({ ...item, quantity: parseFloat(ledgerQty.toFixed(3)) });
                      corrections++;
                  }
              } else {
                  matches++;
              }
          }
      }

      if (fix && updates.length > 0) {
          await db.items.bulkPut(updates);
      }

      return { matches, mismatches, corrections };
  },

  async enrichInventory(onProgress: (current: number, total: number) => void): Promise<{ updated: number, total: number }> {
      const items = await db.items.toArray();
      const candidates = items.filter(i => i.casNumber && i.casNumber.length > 4); // Apenas com CAS válido
      
      let updatedCount = 0;
      let processed = 0;
      
      const updatesV1: InventoryItem[] = [];
      const updatesV2: CatalogProduct[] = [];

      // Chunking para não sobrecarregar API e UI
      const chunks = [];
      const CHUNK_SIZE = 10;
      for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
          chunks.push(candidates.slice(i, i + CHUNK_SIZE));
      }

      for (const chunk of chunks) {
          for (const item of chunk) {
               // Verifica se já tem dados ricos
               if (item.molecularFormula && item.risks && Object.values(item.risks).some(v => v)) {
                   processed++;
                   onProgress(processed, candidates.length);
                   continue;
               }

               const casData = await CasApiService.fetchChemicalData(item.casNumber!);
               if (casData) {
                   const suggestedRisks = CasApiService.analyzeRisks(casData);
                   
                   // Atualiza V1
                   const newItemV1 = {
                       ...item,
                       molecularFormula: casData.molecularFormula,
                       molecularWeight: casData.molecularMass,
                       risks: { ...item.risks, ...suggestedRisks } as RiskFlags
                   };
                   updatesV1.push(newItemV1);

                   // Atualiza V2 (Catalog)
                   if (item.catalogId) {
                       const catalogItem = await db.rawDb.catalog.get(item.catalogId);
                       if (catalogItem) {
                           updatesV2.push({
                               ...catalogItem,
                               molecularFormula: casData.molecularFormula,
                               molecularWeight: casData.molecularMass,
                               risks: { ...catalogItem.risks, ...suggestedRisks } as RiskFlags
                           });
                       }
                   }

                   updatedCount++;
               }
               processed++;
               onProgress(processed, candidates.length);
               await new Promise(r => setTimeout(r, 200)); // Rate limit protection
          }
      }
      
      if (updatesV1.length > 0) {
          await db.transaction('rw', [db.rawDb.items, db.rawDb.catalog], async () => {
              await db.items.bulkPut(updatesV1);
              await db.rawDb.catalog.bulkPut(updatesV2);
          });
      }

      return { updated: updatedCount, total: candidates.length };
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