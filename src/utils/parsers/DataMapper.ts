
import { SqlParser } from './SqlParser';
import { 
    InventoryItem, 
    MovementRecord, 
    FullRelationalDumpDTO,
    CatalogProduct,
    InventoryBatch,
    BusinessPartner,
    StorageLocationEntity,
    StockBalance,
} from '../../types';
import { generateInventoryId, sanitizeProductName, generateHash, normalizeStr } from '../stringUtils';
import { mapMovementType } from '../businessRules';

/**
 * Utilitário responsável por converter dados brutos (SQL, JSON legado, Relational DTO)
 * em entidades tipadas do sistema (V1 e V2).
 */
export const DataMapper = {

    /**
     * Gera estruturas normalizadas V2 a partir de uma lista plana de itens V1.
     * Fundamental para manter a integridade do Ledger.
     */
    deriveNormalizedData(items: InventoryItem[]) {
        const catalogMap = new Map<string, CatalogProduct>();
        const partnerMap = new Map<string, BusinessPartner>();
        const locationMap = new Map<string, StorageLocationEntity>();
        const batchMap = new Map<string, InventoryBatch>();
        const balances: StockBalance[] = [];
    
        items.forEach(item => {
            // 1. CATALOG (Definição do Produto)
            // Usa catalogId já existente ou gera determinístico baseado em SAP + Nome
            const catalogId = item.catalogId || `CAT-${generateInventoryId(item.sapCode, item.name, '')}`; 
            
            if (!catalogMap.has(catalogId)) {
                catalogMap.set(catalogId, {
                    id: catalogId, 
                    sapCode: item.sapCode, 
                    name: item.name, 
                    casNumber: item.casNumber,
                    molecularFormula: item.molecularFormula, 
                    molecularWeight: item.molecularWeight,
                    risks: item.risks || { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false }, 
                    categoryId: item.category, 
                    baseUnit: item.baseUnit,
                    isControlled: item.isControlled || false, 
                    minStockLevel: item.minStockLevel || 0, 
                    isActive: true,
                    createdAt: item.createdAt || new Date().toISOString(),
                    itemType: item.itemType,
                    glassVolume: item.glassVolume,
                    glassMaterial: item.glassMaterial,
                    updatedAt: new Date().toISOString()
                });
            }

            // 2. PARTNER (Fornecedor)
            const supplierName = item.supplier?.trim() || 'Genérico';
            const partnerId = `PRT-${generateHash(normalizeStr(supplierName))}`;
            
            if (!partnerMap.has(partnerId)) {
                partnerMap.set(partnerId, { 
                    id: partnerId, 
                    name: supplierName, 
                    type: 'SUPPLIER', 
                    active: true,
                    createdAt: new Date().toISOString()
                });
            }
            
            // 3. LOCATION (Local Físico)
            const locStr = `${item.location.warehouse || 'Geral'} ${item.location.cabinet || ''} ${item.location.shelf || ''}`.trim();
            const locId = `LOC-${generateHash(normalizeStr(locStr))}`;
            
            if (!locationMap.has(locId)) {
                locationMap.set(locId, { 
                    id: locId, 
                    name: item.location.warehouse || 'Geral', 
                    type: item.location.cabinet ? 'CABINET' : 'WAREHOUSE', 
                    pathString: locStr,
                    createdAt: new Date().toISOString()
                });
            }
            
            // 4. BATCH (Lote Físico)
            const batchId = item.batchId || `BAT-${item.id}`;
            
            // Verifica se o lote já foi processado para evitar duplicatas em caso de dados sujos
            if (!batchMap.has(batchId)) {
                batchMap.set(batchId, {
                    id: batchId, 
                    catalogId: catalogId, 
                    partnerId: partnerId, 
                    lotNumber: item.lotNumber,
                    unitCost: item.unitCost || 0, 
                    expiryDate: item.expiryDate, 
                    status: item.itemStatus === 'Ativo' ? 'ACTIVE' : 'BLOCKED', 
                    createdAt: item.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            // 5. BALANCE (Saldo no Local)
            // Balance ID determinístico: Um lote só pode ter um registro de saldo por local
            const balanceId = `BAL-${generateHash(batchId + locId)}`;
            balances.push({
                id: balanceId, 
                batchId: batchId, 
                locationId: locId, 
                quantity: item.quantity,
                lastMovementAt: item.lastUpdated || new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
        });
        
        return { 
            catalog: Array.from(catalogMap.values()), 
            partners: Array.from(partnerMap.values()), 
            locations: Array.from(locationMap.values()), 
            batches: Array.from(batchMap.values()), 
            balances 
        };
    },

    /**
     * Processa dados crus (SQL Strings ou Objetos) para o formato interno.
     * Suporta o formato específico LIMS: Produtos -> Lotes -> Movimentações
     */
    async prepareRawData(raw: any) {
        const itemsToInsert: InventoryItem[] = [];
        const historyToInsert: MovementRecord[] = [];
        
        // Mapas para integridade referencial durante o parse
        // Map<LegacyProductID, ProductData>
        const prodMap = new Map<string, any>(); 
        // Map<LegacyBatchID, GeneratedUUID>
        const legacyBatchIdToUuidMap = new Map<string, string>();
        const processedIds = new Set<string>();
        
        let parsedProducts: any[] = [];
        let parsedLots: any[] = [];
        let parsedMovements: any[] = [];
    
        // 1. PARSER DE PRODUTOS
        if (Array.isArray(raw.produtos)) {
            parsedProducts = raw.produtos.map((p: any) => {
                if (typeof p === 'string') {
                    const vals = SqlParser.parseInsertValues(p);
                    // LIMS SQL: cdsap, nome, unidade
                    return vals ? { cdsap: String(vals[0]), nome_produto: vals[1], unidade: vals[2] } : null;
                }
                return p;
            }).filter(Boolean);
            
            parsedProducts.forEach(p => {
                if (p.cdsap) prodMap.set(String(p.cdsap), p);
            });
        }
    
        // 2. PARSER DE LOTES (Gera os InventoryItems base)
        if (Array.isArray(raw.lotes)) {
            parsedLots = raw.lotes.map((l: any) => {
                if (typeof l === 'string') {
                    const vals = SqlParser.parseInsertValues(l);
                    // LIMS SQL: id_lote, cdsap, lote, fabricante, validade
                    return vals ? { 
                        id_lote: vals[0], 
                        cdsap: String(vals[1]), 
                        lote: vals[2], 
                        fabricante: vals[3], 
                        validade: vals[4] 
                    } : null;
                }
                return l;
            }).filter(Boolean);
            
            for (const lot of parsedLots) {
                // Join com Produtos via CDSAP
                const product = prodMap.get(String(lot.cdsap));
                
                const rawName = product ? product.nome_produto : `Produto ${lot.cdsap}`;
                const prodName = sanitizeProductName(rawName);
                const unit = product ? product.unidade : 'UN';
                const sap = lot.cdsap || 'S/ SAP';
                const lotNum = lot.lote || 'GEN';
                const supplier = sanitizeProductName(lot.fabricante || 'Desconhecido');
                
                // Geração de ID Determinístico (Garante unicidade do lote no sistema)
                const deterministicId = generateInventoryId(sap, prodName, lotNum);
                
                // Guarda referência do ID antigo (SQL) para o novo UUID
                legacyBatchIdToUuidMap.set(String(lot.id_lote), deterministicId);
        
                if (processedIds.has(deterministicId)) continue;
                processedIds.add(deterministicId);
                
                const batchId = `BAT-${deterministicId}`;
                const catalogId = `CAT-${generateInventoryId(sap, prodName, '')}`;

                // Pre-calculate Location ID to match deriveNormalizedData logic
                const locStr = 'Geral';
                const locationId = `LOC-${generateHash(normalizeStr(locStr))}`;

                itemsToInsert.push({
                    id: deterministicId, 
                    sapCode: sap, 
                    name: prodName, 
                    lotNumber: lotNum, 
                    baseUnit: unit, 
                    quantity: 0, // Será calculado via movimentações
                    category: 'Geral', 
                    minStockLevel: 10, 
                    supplier: supplier,
                    expiryDate: lot.validade || '', 
                    dateAcquired: new Date().toISOString(), 
                    lastUpdated: new Date().toISOString(),
                    itemStatus: 'Ativo', 
                    type: 'ROH', 
                    materialGroup: 'Geral', 
                    isControlled: false, 
                    unitCost: 0, 
                    currency: 'BRL',
                    location: { warehouse: 'Geral', cabinet: '', shelf: '', position: '' },
                    locationId,
                    risks: { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false },
                    batchId,
                    catalogId
                });
            }
        }
        
        // Map para acesso rápido durante processamento de movimentações
        const itemsMap = new Map(itemsToInsert.map(i => [i.id, i]));
        const newGhostItems: InventoryItem[] = []; // Itens que têm movim. mas não tinham cadastro de lote
        
        // 3. PARSER DE MOVIMENTAÇÕES
        const movementsSource = raw.movimentacoes || raw.movementHistory || [];
        if (Array.isArray(movementsSource)) {
            parsedMovements = movementsSource.map((m: any) => {
                 if (typeof m === 'string') {
                     const vals = SqlParser.parseInsertValues(m);
                     if (vals) {
                         // Lógica Polimórfica para SQL
                         // 4 colunas: id_lote, tipo, data, qtd
                         if (vals.length === 4) {
                             return { id_lote: vals[0], tipo_mov: vals[1], data_mov: vals[2], quantidade: vals[3] };
                         }
                         // 5 colunas: id_mov, id_lote, tipo, data, qtd
                         if (vals.length === 5) {
                             return { id_mov: vals[0], id_lote: vals[1], tipo_mov: vals[2], data_mov: vals[3], quantidade: vals[4] };
                         }
                     }
                     return null;
                 }
                 return m;
            }).filter(Boolean);
            
            // Processamento Lógico (Cálculo de Saldo)
            parsedMovements.forEach((m, idx) => {
                 const legacyIdStr = String(m.id_lote);
                 const targetId = legacyBatchIdToUuidMap.get(legacyIdStr);
                 let linkedItem: InventoryItem | undefined;
                 
                 if (targetId) {
                     linkedItem = itemsMap.get(targetId);
                 }
                 
                 // Fallback: Ghost Item (Item existe na mov. mas não no cadastro de lotes)
                 if (!linkedItem) {
                     const ghostName = `Item Legado ${legacyIdStr}`;
                     const ghostId = generateInventoryId('LEGACY', ghostName, 'GEN');
                     
                     if (!itemsMap.has(ghostId)) {
                         const ghostItem: InventoryItem = {
                             id: ghostId, sapCode: 'LEGACY', name: ghostName,
                             lotNumber: 'GEN', baseUnit: 'UN', quantity: 0, category: 'Arquivo Morto',
                             minStockLevel: 0, supplier: 'Legado', expiryDate: '', dateAcquired: m.data_mov || new Date().toISOString(),
                             lastUpdated: new Date().toISOString(), itemStatus: 'Obsoleto', type: 'ROH', materialGroup: 'Legacy',
                             isControlled: false, unitCost: 0, currency: 'BRL', location: { warehouse: 'Arquivo', cabinet: '', shelf: '', position: '' },
                             locationId: `LOC-${generateHash(normalizeStr('Arquivo'))}`,
                             risks: { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false },
                             isGhost: true, 
                             batchId: `BAT-${ghostId}`,
                             catalogId: `CAT-${generateInventoryId('LEGACY', ghostName, '')}`
                         };
                         newGhostItems.push(ghostItem);
                         itemsMap.set(ghostId, ghostItem);
                         linkedItem = ghostItem;
                         
                         // Registra para próximas iterações
                         legacyBatchIdToUuidMap.set(legacyIdStr, ghostId);
                     } else {
                         linkedItem = itemsMap.get(ghostId);
                     }
                 }
        
                 const type = mapMovementType(m.tipo_mov);
                 const qty = Number(m.quantidade) || 0;
                 const locationRef = linkedItem?.location?.warehouse || 'Geral';
        
                 if (linkedItem) {
                     // Atualiza saldo do snapshot V1
                     if (type === 'ENTRADA') linkedItem.quantity += qty;
                     else if (type === 'SAIDA') linkedItem.quantity -= qty;
                     
                     // Ajusta data de aquisição pela primeira entrada
                     if (type === 'ENTRADA' && m.data_mov && (!linkedItem.dateAcquired || m.data_mov < linkedItem.dateAcquired)) {
                         linkedItem.dateAcquired = m.data_mov;
                     }
                 }
                 
                 const historyId = generateHash(`${linkedItem!.id}-${m.data_mov}-${type}-${qty}-${idx}`);
        
                 historyToInsert.push({
                    id: `HIST-${historyId}`, 
                    itemId: linkedItem!.id, 
                    batchId: linkedItem!.batchId,
                    date: m.data_mov || new Date().toISOString(), 
                    type: type, 
                    productName: linkedItem!.name,
                    sapCode: linkedItem!.sapCode, 
                    lot: linkedItem!.lotNumber, 
                    quantity: qty,
                    unit: linkedItem!.baseUnit, 
                    location_warehouse: locationRef, 
                    supplier: linkedItem!.supplier, 
                    observation: linkedItem!.isGhost ? 'Recuperado do histórico' : 'Importado do LIMS',
                    toLocationId: type === 'ENTRADA' ? `LOC-${generateHash(locationRef)}` : undefined,
                    fromLocationId: type === 'SAIDA' ? `LOC-${generateHash(locationRef)}` : undefined
                 });
            });
        }
    
        // Concatena itens normais e fantasmas
        const finalItems = [...itemsToInsert, ...newGhostItems];
        
        // Cleanup de saldos negativos (opcional, mas bom para integridade visual)
        finalItems.forEach(i => i.quantity = Math.max(0, parseFloat(i.quantity.toFixed(3))));
        
        return { items: finalItems, history: historyToInsert };
    },

    /**
     * Wrapper para processar DTO Relacional (formato JSON de backup)
     */
    async prepareRelationalData(dto: FullRelationalDumpDTO) {
        // Reusa a lógica robusta acima convertendo DTO para o formato "Raw" esperado
        const rawAdaptation = {
            produtos: dto.relationalData?.productBatches?.map(b => ({
                cdsap: b.sapCode,
                nome_produto: b.productName,
                unidade: b.unitOfMeasure
            })) || [],
            lotes: dto.relationalData?.productBatches?.map(b => ({
                id_lote: b.id,
                cdsap: b.sapCode,
                lote: b.batch,
                fabricante: b.manufacturer,
                validade: b.expirationDate
            })) || [],
            movimentacoes: dto.relationalData?.movementHistory?.map(m => ({
                id_lote: m.productBatchId,
                tipo_mov: m.movementType,
                data_mov: m.movementDate,
                quantidade: m.quantity
            })) || []
        };
        
        return this.prepareRawData(rawAdaptation);
    }
};
