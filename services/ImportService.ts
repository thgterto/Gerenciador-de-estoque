
import { db } from '../db';
import { InventoryItem, MovementRecord, ImportResult, RiskFlags } from '../types';
import { CasApiService } from './CasApiService';
import { DataMapper } from '../utils/parsers/DataMapper';
import { generateHash, normalizeStr } from '../utils/stringUtils';

function hasActiveRisks(risks?: RiskFlags): boolean {
    if (!risks) return false;
    return Object.values(risks).some(val => val === true);
}

export const ImportService = {
  
  // --- Bulk Import with Smart Merge Strategy ---
  
  async importBulk(newItems: InventoryItem[], replaceMode: boolean = false): Promise<ImportResult> {
      const stats = { total: newItems.length, created: 0, updated: 0, ignored: 0 };

      try {
        // Strategy 1: WIPE & LOAD (Total Replacement)
        if (replaceMode) {
             const v2Data = DataMapper.deriveNormalizedData(newItems);
             await db.transaction('rw', [
                db.rawDb.items, 
                db.rawDb.catalog, 
                db.rawDb.batches, 
                db.rawDb.partners, 
                db.rawDb.storage_locations, 
                db.rawDb.balances,
                db.rawDb.history
             ], async () => {
                 await Promise.all([
                     db.rawDb.items.clear(),
                     db.rawDb.catalog.clear(),
                     db.rawDb.batches.clear(),
                     db.rawDb.partners.clear(),
                     db.rawDb.storage_locations.clear(),
                     db.rawDb.balances.clear(),
                     db.rawDb.history.clear()
                 ]);
                 
                 // Use bulkAdd for performance on empty tables
                 await db.items.bulkAdd(newItems);
                 if (v2Data.catalog.length > 0) await db.rawDb.catalog.bulkAdd(v2Data.catalog);
                 if (v2Data.batches.length > 0) await db.rawDb.batches.bulkAdd(v2Data.batches);
                 if (v2Data.partners.length > 0) await db.rawDb.partners.bulkAdd(v2Data.partners);
                 if (v2Data.locations.length > 0) await db.rawDb.storage_locations.bulkAdd(v2Data.locations);
                 if (v2Data.balances.length > 0) await db.rawDb.balances.bulkAdd(v2Data.balances);
             });
             
             stats.created = newItems.length;
             return stats;
        }

        // Strategy 2: SMART MERGE (Incremental Update)
        // Recupera itens existentes para comparar
        const idsToCheck = newItems.map(i => i.id);
        const existingRecords = await db.items.bulkGet(idsToCheck); 
        
        const existingMap = new Map<string, InventoryItem>();
        existingRecords.forEach(item => {
            if (item) existingMap.set(item.id, item);
        });
        
        const mergedItems: InventoryItem[] = [];

        newItems.forEach(newItem => {
            const existing = existingMap.get(newItem.id);
            
            if (existing) {
                stats.updated++;
                // Merge lógico: Preserva dados enriquecidos (CAS, Riscos) se a origem não tiver
                const merged: InventoryItem = {
                    ...newItem,
                    casNumber: newItem.casNumber || existing.casNumber,
                    molecularFormula: newItem.molecularFormula || existing.molecularFormula,
                    risks: hasActiveRisks(newItem.risks) ? newItem.risks : existing.risks,
                    // Preserva saldo existente a menos que seja um reset explícito (tratado em outro lugar)
                    // No import mestre, geralmente a planilha é a verdade, MAS se a planilha
                    // tem quantidade 0 (definição de produto), não queremos zerar o estoque real.
                    // Se a planilha tem quantidade > 0, isso geralmente vira um movimento de entrada separado.
                    // Aqui assumimos que se a planilha traz quantidade, é uma entrada inicial ou ajuste.
                    // Porém, importBulk é chamado para cadastro mestre.
                    quantity: existing.quantity 
                };
                mergedItems.push(merged);
            } else {
                stats.created++;
                mergedItems.push(newItem);
            }
        });

        // Persist Merged Data and V2 structures
        const v2Data = DataMapper.deriveNormalizedData(mergedItems);

        await db.transaction('rw', [
            db.rawDb.items, 
            db.rawDb.catalog, 
            db.rawDb.batches, 
            db.rawDb.partners, 
            db.rawDb.storage_locations, 
            db.rawDb.balances
        ], async () => {
            await db.items.bulkPut(mergedItems);
            
            if (v2Data.catalog.length > 0) await db.rawDb.catalog.bulkPut(v2Data.catalog);
            if (v2Data.batches.length > 0) await db.rawDb.batches.bulkPut(v2Data.batches);
            if (v2Data.partners.length > 0) await db.rawDb.partners.bulkPut(v2Data.partners);
            if (v2Data.locations.length > 0) await db.rawDb.storage_locations.bulkPut(v2Data.locations);
            // Balances: Careful not to overwrite quantities if we kept them from 'existing'
            // Ideally balances logic should follow items logic.
            // Since deriveNormalizedData uses item.quantity, and we kept existing.quantity, 
            // v2Data.balances has the correct quantity.
            if (v2Data.balances.length > 0) await db.rawDb.balances.bulkPut(v2Data.balances);
        });
        
        // Auto-trigger enrichment for items with missing chemical data
        // This runs in background to avoid blocking UI
        setTimeout(() => {
             this.enrichInventory((c, t) => console.log(`[Auto-Enrich] ${c}/${t}`));
        }, 2000);

        return stats;
      } catch (e) {
        db.invalidateCaches();
        throw e;
      }
  },

  async importHistoryBulk(history: MovementRecord[], updateStockBalance: boolean = false): Promise<ImportResult> {
      const stats = { total: history.length, created: history.length, updated: 0, ignored: 0 };

      try {
        await db.transaction('rw', [db.rawDb.history, db.rawDb.items, db.rawDb.balances], async () => {
            // Use bulkPut instead of bulkAdd to handle duplicate imports idempotently without crashing
            await db.history.bulkPut(history);

            if (updateStockBalance) {
                // Aggregate changes per item
                const qtyMap = new Map<string, number>();
                history.forEach(h => {
                    const current = qtyMap.get(h.itemId) || 0;
                    if (h.type === 'ENTRADA') qtyMap.set(h.itemId, current + h.quantity);
                    else if (h.type === 'SAIDA') qtyMap.set(h.itemId, current - h.quantity);
                    // Adjustments in bulk import are tricky, assuming delta logic or ignored for simple balance calc
                });

                // Apply changes
                const itemIds = Array.from(qtyMap.keys());
                const items = await db.items.bulkGet(itemIds);

                const updatedItems: InventoryItem[] = [];
                const updatedBalances: any[] = []; // Simplified V2 balance update

                items.forEach((item, idx) => {
                    if (!item) return;
                    const delta = qtyMap.get(itemIds[idx]) || 0;
                    const newQty = Math.max(0, item.quantity + delta);

                    const upItem = { ...item, quantity: newQty, lastUpdated: new Date().toISOString() };
                    updatedItems.push(upItem);

                    // Update V2 Balance (Main location)
                    const batchId = item.batchId || `BAT-${item.id}`;
                    let locationId = item.locationId;

                    // If locationId is missing (legacy data), derive it from location object to match DataMapper logic
                    if (!locationId) {
                        const locStr = `${item.location.warehouse || 'Geral'} ${item.location.cabinet || ''} ${item.location.shelf || ''}`.trim();
                        locationId = `LOC-${generateHash(normalizeStr(locStr))}`;
                    }

                    const balanceId = `BAL-${generateHash(batchId + locationId)}`;

                    if (batchId && locationId) {
                        updatedBalances.push({
                            id: balanceId,
                            batchId: batchId,
                            locationId: locationId,
                            quantity: newQty,
                            lastMovementAt: new Date().toISOString()
                        });
                    }
                });

                if (updatedItems.length > 0) await db.items.bulkPut(updatedItems);
                if (updatedBalances.length > 0) await db.rawDb.balances.bulkPut(updatedBalances);
            }
        });

        return stats;
      } catch (e) {
        db.invalidateCaches();
        throw e;
      }
  },

  async enrichInventory(onProgress: (current: number, total: number) => void): Promise<{ total: number, updated: number }> {
      const items = await db.items.toArray();
      // Filter items that have a valid CAS but are missing enriched data (formula or risks)
      const candidates = items.filter(i => i.casNumber && i.casNumber.length > 4 && (!i.molecularFormula || !hasActiveRisks(i.risks)));
      
      let updatedCount = 0;

      // Extract unique CAS numbers
      const casList = candidates.map(c => c.casNumber!);
      
      // Fetch data in batches
      const results = await CasApiService.fetchBatchChemicalData(casList, (curr, tot) => {
          onProgress(curr, tot);
      });

      const updates: InventoryItem[] = [];

      candidates.forEach(item => {
          const data = results[item.casNumber!];
          if (data) {
              const suggestedRisks = CasApiService.analyzeRisks(data);
              updates.push({
                  ...item,
                  molecularFormula: item.molecularFormula || data.molecularFormula,
                  molecularWeight: item.molecularWeight || data.molecularMass,
                  risks: hasActiveRisks(item.risks) ? item.risks : { ...item.risks, ...suggestedRisks } as RiskFlags
              });
              updatedCount++;
          }
      });

      if (updates.length > 0) {
        try {
          // Re-derive normalized data for V2 to propagate enrichment to Catalog
          const v2Data = DataMapper.deriveNormalizedData(updates);
          await db.transaction('rw', [db.rawDb.items, db.rawDb.catalog], async () => {
              await db.items.bulkPut(updates);
              if (v2Data.catalog.length > 0) await db.rawDb.catalog.bulkPut(v2Data.catalog);
          });
        } catch (e) {
          db.invalidateCaches();
          throw e;
        }
      }

      return { total: candidates.length, updated: updatedCount };
  }
};
