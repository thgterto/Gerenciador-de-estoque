
import { db } from '../db';
import { 
    InventoryItem, 
    MovementRecord, 
    FullRelationalDumpDTO, 
    RiskFlags, 
    ProductBatchDTO,
    CatalogProduct,
    InventoryBatch,
    BusinessPartner,
    StorageLocationEntity,
    StockBalance
} from '../types';
import { generateInventoryId, sanitizeProductName } from '../utils/stringUtils';
import { mapMovementType } from '../utils/businessRules';
import { InventoryService } from './InventoryService';

const parseSqlInsert = (sql: string): any[] | null => {
    if (typeof sql !== 'string') return null;
    const match = sql.match(/VALUES\s*\((.*)\)/i);
    if (!match) return null;
    const inner = match[1];
    const values: any[] = [];
    const regex = /'([^']*)'|([^,]+)/g;
    let m;
    while ((m = regex.exec(inner)) !== null) {
        if (m[1] !== undefined) values.push(m[1]);
        else if (m[2]) {
            const val = m[2].trim();
            if (val.toUpperCase() === 'NULL') values.push(null);
            else if (!isNaN(Number(val))) values.push(Number(val));
            else values.push(val);
        }
    }
    return values;
};

const mapRisks = (batch: ProductBatchDTO | any): RiskFlags => {
    return {
        O: !!batch.notO || !!batch.riskO, 
        T: !!batch.riskI,  
        T_PLUS: !!batch.riskIPlus,
        C: !!batch.riskC,
        E: !!batch.riskA, 
        N: !!batch.riskN,
        Xn: !!batch.riskGn,
        Xi: !!batch.riskAl,
        F: !!batch.riskJ,
        F_PLUS: !!batch.riskJPlus
    };
};

export const processLimsData = async (sourceData: any) => {
    let flatItems: InventoryItem[] = [];
    let historyItems: MovementRecord[] = [];

    if (sourceData.dml) {
        console.log('DatabaseSeeder: Processando formato SQL DML...');
        const result = await prepareRawData(sourceData.dml);
        flatItems = result.items;
        historyItems = result.history;
    } else if (sourceData.relationalData) {
        console.log('DatabaseSeeder: Processando formato Relacional...');
        const result = await prepareRelationalData(sourceData as FullRelationalDumpDTO);
        flatItems = result.items;
        historyItems = result.history;
    } else if (sourceData.data && sourceData.metadata) {
        console.log('DatabaseSeeder: Processando formato Backup Nativo...');
        flatItems = sourceData.data.items || [];
        historyItems = sourceData.data.history || [];
    } else if (sourceData.dados) {
        console.log('DatabaseSeeder: Processando formato JSON Legado (dados)...');
        const result = await prepareRawData(sourceData.dados);
        flatItems = result.items;
        historyItems = result.history;
    }
    return { flatItems, historyItems };
};

export const seedDatabase = async (force: boolean = false, customData?: any) => {
  try {
      const count = await db.rawDb.items.count();
      if (!force && count > 0) return;

      console.log('Iniciando Seeding/Restore...');
      
      let sourceData: any = customData;
      
      // Lazy Loading: Carrega os dados pesados apenas se necessário
      if (!sourceData) {
          console.log('Carregando módulo de dados LIMS sob demanda...');
          try {
              const module = await import('../limsData');
              sourceData = (window as any).LIMS_DATA || module.LIMS_DATA;
          } catch (e) {
              console.warn('Falha ao carregar limsData padrão, tentando fallback...', e);
              sourceData = { metadata: { status: 'EMPTY' }, dml: { produtos: [], lotes: [], movimentacoes: [] } };
          }
      }

      const { flatItems, historyItems } = await processLimsData(sourceData);
      const v2Data = deriveNormalizedData(flatItems);

      if (force) {
          await db.transaction('rw', [
              db.rawDb.items, db.rawDb.history, db.rawDb.catalog, db.rawDb.batches, db.rawDb.partners, 
              db.rawDb.storage_locations, db.rawDb.balances, db.rawDb.locations, db.rawDb.suppliers
          ], async () => {
              await Promise.all([
                  db.rawDb.items.clear(), db.rawDb.history.clear(), db.rawDb.catalog.clear(),
                  db.rawDb.batches.clear(), db.rawDb.partners.clear(), db.rawDb.storage_locations.clear(),
                  db.rawDb.balances.clear()
              ]);
              if (flatItems.length > 0) await db.rawDb.items.bulkAdd(flatItems);
              if (historyItems.length > 0) await db.rawDb.history.bulkAdd(historyItems);
              if (v2Data.catalog.length > 0) await db.rawDb.catalog.bulkAdd(v2Data.catalog);
              if (v2Data.batches.length > 0) await db.rawDb.batches.bulkAdd(v2Data.batches);
              if (v2Data.partners.length > 0) await db.rawDb.partners.bulkAdd(v2Data.partners);
              if (v2Data.locations.length > 0) await db.rawDb.storage_locations.bulkAdd(v2Data.locations);
              if (v2Data.balances.length > 0) await db.rawDb.balances.bulkAdd(v2Data.balances);
          });
      } else {
          // Importação incremental (Usa InventoryService para deduplicação correta)
          if (flatItems.length > 0) await InventoryService.importBulk(flatItems);
          if (historyItems.length > 0) await InventoryService.importHistoryBulk(historyItems, false);
      }
      db.invalidateCaches();
  } catch (error) {
      console.error("CRITICAL: Falha no seed do banco de dados", error);
      throw error;
  }
};

function deriveNormalizedData(items: InventoryItem[]) {
    const catalogMap = new Map<string, CatalogProduct>();
    const partnerMap = new Map<string, BusinessPartner>();
    const locationMap = new Map<string, StorageLocationEntity>();
    const batches: InventoryBatch[] = [];
    const balances: StockBalance[] = [];

    items.forEach(item => {
        const catalogId = `CAT-${generateInventoryId(item.sapCode, item.name, '')}`; // Business Key for Catalog
        if (!catalogMap.has(catalogId)) {
            catalogMap.set(catalogId, {
                id: catalogId, sapCode: item.sapCode, name: item.name, casNumber: item.casNumber,
                molecularFormula: item.molecularFormula, molecularWeight: item.molecularWeight,
                risks: item.risks, categoryId: item.category, baseUnit: item.baseUnit,
                isControlled: item.isControlled, minStockLevel: item.minStockLevel, isActive: true,
                createdAt: item.createdAt || new Date().toISOString()
            });
        }
        const supplierName = item.supplier?.trim() || 'Genérico';
        const partnerId = `PRT-${sanitizeProductName(supplierName).replace(/\s+/g, '-')}`;
        if (!partnerMap.has(partnerId)) {
            partnerMap.set(partnerId, { id: partnerId, name: supplierName, type: 'SUPPLIER', active: true });
        }
        const locStr = `${item.location.warehouse} ${item.location.cabinet || ''}`.trim() || 'Geral';
        const locId = `LOC-${sanitizeProductName(locStr).replace(/\s+/g, '-')}`;
        if (!locationMap.has(locId)) {
            locationMap.set(locId, { id: locId, name: locStr, type: 'CABINET', pathString: locStr });
        }
        
        // Usa o batchId que já foi gerado na preparação dos dados (baseado no UUID)
        const batchId = item.batchId || `BAT-${item.id}`;
        
        batches.push({
            id: batchId, catalogId: catalogId, partnerId: partnerId, lotNumber: item.lotNumber,
            unitCost: item.unitCost, expiryDate: item.expiryDate, 
            status: item.itemStatus === 'Ativo' ? 'ACTIVE' : 'BLOCKED', createdAt: item.createdAt
        });
        balances.push({
            id: crypto.randomUUID(), batchId: batchId, locationId: locId, quantity: item.quantity,
            lastMovementAt: new Date().toISOString()
        });
    });
    return { catalog: Array.from(catalogMap.values()), partners: Array.from(partnerMap.values()), locations: Array.from(locationMap.values()), batches, balances };
}

async function prepareRelationalData(dto: FullRelationalDumpDTO) {
    const { locations, suppliers, productBatches, movementHistory } = dto.relationalData || {};
    const items: InventoryItem[] = [];
    const history: MovementRecord[] = [];
    if (!productBatches) return { items, history };

    const locMap = new Map(locations?.map(l => [l.id, l]));
    const supMap = new Map(suppliers?.map(s => [s.id, s]));
    
    // Mapeia ID Interno Legado -> Novo UUID
    const legacyToUuidMap = new Map<number, string>(); 

    for (const batch of productBatches) {
        const loc = locMap.get(batch.locationId);
        const sup = supMap.get(batch.supplierId);
        const cleanName = sanitizeProductName(batch.productName);
        
        // GERAÇÃO DE UUID V4 PARA NOVOS ITENS
        const newUuid = crypto.randomUUID();
        
        // Armazena mapeamento para usar no histórico
        legacyToUuidMap.set(batch.id, newUuid);

        items.push({
            id: newUuid, sapCode: batch.sapCode || 'S/ SAP', name: cleanName, lotNumber: batch.batch || 'GEN',
            baseUnit: batch.unitOfMeasure?.toUpperCase() || 'UN', quantity: 0, category: batch.classification || 'Geral',
            minStockLevel: 10, supplier: sup?.name || batch.manufacturer || 'Desconhecido', expiryDate: batch.expirationDate || '',
            dateAcquired: new Date().toISOString(), lastUpdated: new Date().toISOString(), itemStatus: 'Ativo',
            type: 'ROH', materialGroup: 'Geral', isControlled: false, unitCost: batch.costPerUnit || 0, currency: 'BRL',
            location: { warehouse: loc?.storageLocation || 'Geral', cabinet: loc?.cabinet || '', shelf: loc?.floor || '', position: loc?.position || '' },
            risks: mapRisks(batch), batchId: `BAT-${newUuid}`
        });
    }

    if (movementHistory) {
        const sortedHistory = [...movementHistory].sort((a, b) => new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime());
        const itemMap = new Map(items.map(i => [i.id, i]));
        
        sortedHistory.forEach((mov, idx) => {
            const targetUuid = legacyToUuidMap.get(mov.productBatchId);
            if (!targetUuid) return;
            
            const item = itemMap.get(targetUuid);
            if (item) {
                const qty = Number(mov.quantity) || 0;
                const type = mapMovementType(mov.movementType);
                if (type === 'ENTRADA') item.quantity += qty;
                else if (type === 'SAIDA') item.quantity -= qty;
                else if (type === 'AJUSTE') item.quantity = qty; 
                
                history.push({
                    id: crypto.randomUUID(), 
                    itemId: item.id, 
                    batchId: item.batchId, 
                    date: mov.movementDate,
                    type: type, 
                    quantity: qty, 
                    unit: item.baseUnit, 
                    productName: item.name, 
                    sapCode: item.sapCode,
                    lot: item.lotNumber, 
                    location_warehouse: item.location.warehouse, 
                    supplier: item.supplier,
                    observation: `Movimentação ${mov.id || 'Legado'}`
                });
            }
        });
    }
    items.forEach(i => i.quantity = Math.max(0, parseFloat(i.quantity.toFixed(3))));
    return { items, history };
}

async function prepareRawData(raw: any) {
    const itemsToInsert: InventoryItem[] = [];
    const historyToInsert: MovementRecord[] = [];
    
    // Mapeia Chave Legada (ID ou LoteID) -> Novo UUID
    const legacyIdMap = new Map<string, string>();
    
    let parsedProducts: any[] = [];
    let parsedLots: any[] = [];
    let parsedMovements: any[] = [];

    if (Array.isArray(raw.produtos)) {
        parsedProducts = raw.produtos.map((p: any) => {
            if (typeof p === 'string') {
                const vals = parseSqlInsert(p);
                return vals ? { cdsap: String(vals[0]), nome_produto: vals[1], unidade: vals[2] } : null;
            }
            return p;
        }).filter(Boolean);
    }

    if (Array.isArray(raw.lotes)) {
        parsedLots = raw.lotes.map((l: any) => {
            if (typeof l === 'string') {
                const vals = parseSqlInsert(l);
                return vals ? { id_lote: vals[0], cdsap: String(vals[1]), lote: vals[2], fabricante: vals[3], validade: vals[4] } : null;
            }
            return l;
        }).filter(Boolean);
    }
    
    const movementsSource = raw.movimentacoes || raw.movementHistory || [];
    if (Array.isArray(movementsSource)) {
        parsedMovements = movementsSource.map((m: any) => {
             if (typeof m === 'string') {
                 const vals = parseSqlInsert(m);
                 return vals ? { id_mov: vals[0], id_lote: vals[1], tipo_mov: vals[2], data_mov: vals[3], quantidade: vals[4] } : null;
             }
             return m;
        }).filter(Boolean);
    }

    const prodMap = new Map(parsedProducts.map(p => [String(p.cdsap), p]));

    for (const lot of parsedLots) {
        const product = prodMap.get(String(lot.cdsap));
        const rawName = product ? product.nome_produto : `Produto ${lot.cdsap}`;
        const prodName = sanitizeProductName(rawName);
        const unit = product ? product.unidade : 'UN';
        const sap = lot.cdsap || 'S/ SAP';
        const lotNum = lot.lote || 'GEN';
        
        // GERA UUID V4
        const newUuid = crypto.randomUUID();
        
        legacyIdMap.set(String(lot.id_lote || lot.id), newUuid);

        itemsToInsert.push({
            id: newUuid, sapCode: sap, name: prodName, lotNumber: lotNum, baseUnit: unit, quantity: 0,
            category: 'Geral', minStockLevel: 0, supplier: sanitizeProductName(lot.fabricante || 'Desconhecido'),
            expiryDate: lot.validade || '', dateAcquired: new Date().toISOString(), lastUpdated: new Date().toISOString(),
            itemStatus: 'Ativo', type: 'ROH', materialGroup: 'Geral', isControlled: false, unitCost: 0, currency: 'BRL',
            location: { warehouse: 'Geral', cabinet: '', shelf: '', position: '' },
            risks: { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false },
            batchId: `BAT-${newUuid}`
        });
    }

    const itemsMap = new Map(itemsToInsert.map(i => [i.id, i]));
    const newGhostItems: InventoryItem[] = [];

    parsedMovements.forEach((m, idx) => {
         const legacyIdStr = String(m.id_lote);
         // Tenta resolver o ID legado para o novo UUID
         const targetId = legacyIdMap.get(legacyIdStr);
         let linkedItem: InventoryItem | undefined;
         
         if (targetId) {
             linkedItem = itemsMap.get(targetId);
         }
         
         // Se não encontrou o item pai (Ghost Item), cria um novo com UUID
         if (!linkedItem) {
             const ghostUuid = crypto.randomUUID();
             
             // Evita duplicar ghosts se o ID legado se repetir (ex: múltiplas transações para lote órfão)
             // Precisamos de um mapa auxiliar para ghosts? 
             // Simplificação: para dados raw, assumimos que id_lote é a chave.
             // Se id_lote já foi processado como ghost antes, reuse.
             let existingGhost = newGhostItems.find(g => g.sapCode === (m.cdsap || 'N/A') && g.lotNumber === (m.lote || 'N/A'));
             
             // Se não temos info suficiente para deduzir, cria novo
             if (!existingGhost) {
                 const ghostItem: InventoryItem = {
                     id: ghostUuid, sapCode: m.cdsap || 'N/A', name: `Item Legado (${m.lote || m.id_lote})`,
                     lotNumber: m.lote || 'N/A', baseUnit: 'UN', quantity: 0, category: 'Arquivo Morto',
                     minStockLevel: 0, supplier: 'Legado', expiryDate: '', dateAcquired: m.data_mov || new Date().toISOString(),
                     lastUpdated: new Date().toISOString(), itemStatus: 'Obsoleto', type: 'ROH', materialGroup: 'Legacy',
                     isControlled: false, unitCost: 0, currency: 'BRL', location: { warehouse: 'Arquivo', cabinet: '', shelf: '', position: '' },
                     risks: { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false },
                     isGhost: true, batchId: `BAT-${ghostUuid}`
                 };
                 newGhostItems.push(ghostItem);
                 itemsMap.set(ghostUuid, ghostItem);
                 linkedItem = ghostItem;
                 
                 // Se tiver ID legado, mapeia para futuro reuso
                 if (legacyIdStr && legacyIdStr !== 'undefined') legacyIdMap.set(legacyIdStr, ghostUuid);
             } else {
                 linkedItem = existingGhost;
             }
         }

         const type = mapMovementType(m.tipo_mov);
         const qty = Number(m.quantidade) || 0;

         if (linkedItem) {
             if (type === 'ENTRADA') linkedItem.quantity += qty;
             else if (type === 'SAIDA') linkedItem.quantity -= qty;
             if (m.data_mov && (!linkedItem.dateAcquired || m.data_mov < linkedItem.dateAcquired)) {
                 linkedItem.dateAcquired = m.data_mov;
             }
         }

         historyToInsert.push({
            id: crypto.randomUUID(), 
            itemId: linkedItem!.id, 
            batchId: linkedItem!.batchId,
            date: m.data_mov || new Date().toISOString(), 
            type: type, 
            productName: linkedItem!.name,
            sapCode: linkedItem!.sapCode, 
            lot: linkedItem!.lotNumber, 
            quantity: qty,
            unit: linkedItem!.baseUnit, 
            location_warehouse: linkedItem!.location.warehouse,
            supplier: linkedItem!.supplier, 
            observation: linkedItem!.isGhost ? 'Recuperado do histórico' : 'Importado'
         });
    });

    const finalItems = [...itemsToInsert, ...newGhostItems];
    finalItems.forEach(i => i.quantity = Math.max(0, parseFloat(i.quantity.toFixed(3))));
    return { items: finalItems, history: historyToInsert };
}