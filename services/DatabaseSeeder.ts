
import { db } from '../db';
import { InventoryItem, MovementRecord, FullRelationalDumpDTO, CatalogProduct, InventoryBatch, StorageLocationEntity, BusinessPartner, StockMovement, StockBalance, StorageAddress } from '../types';
import { ImportService } from './ImportService';
import { DataMapper } from '../utils/parsers/DataMapper';
import seedDataRaw from '../database/seed_data.json';

const seedData = seedDataRaw as any;

export const processLimsData = async (sourceData: any) => {
    let flatItems: InventoryItem[] = [];
    let historyItems: MovementRecord[] = [];

    if (sourceData.catalog && sourceData.batches) {
        console.log('DatabaseSeeder: Processando formato V2 Normalized...');
        // Process V2 Format (Seed Data)
        // Similar to utils/seeder.ts logic
        const catalogMap = new Map((sourceData.catalog as CatalogProduct[]).map((c: any) => [c.id, c]));
        const batchMap = new Map((sourceData.batches as InventoryBatch[]).map((b: any) => [b.id, b]));
        const locMap = new Map((sourceData.storage_locations as StorageLocationEntity[]).map((l: any) => [l.id, l]));
        const partnerMap = new Map((sourceData.partners as BusinessPartner[]).map((p: any) => [p.id, p]));

        // Generate Items from Balances
        for (const bal of (sourceData.balances as StockBalance[])) {
            const batch = batchMap.get(bal.batchId);
            const catalog = catalogMap.get(batch?.catalogId || '');
            const location = locMap.get(bal.locationId);
            const partner = partnerMap.get(batch?.partnerId || '');

            if (!batch || !catalog || !location) continue;

            // Parse Location Path to StorageAddress
            // "Name > Cabinet > Floor > Position"
            const parts = (location.pathString || location.name).split(' > ');
            const storageAddress: StorageAddress = {
                warehouse: parts[0] || 'Unknown',
                cabinet: parts[1] || '',
                shelf: parts[2] || '', // Floor mapped to shelf
                position: parts[3] || ''
            };

            const item: InventoryItem = {
                id: bal.id, // Use Balance ID as Item ID
                // Keys
                catalogId: catalog.id,
                batchId: batch.id,
                locationId: location.id,
                // Catalog Props
                sapCode: catalog.sapCode,
                name: catalog.name,
                itemType: catalog.itemType || 'REAGENT',
                category: catalog.categoryId,
                baseUnit: catalog.baseUnit,
                minStockLevel: catalog.minStockLevel,
                risks: catalog.risks,
                casNumber: catalog.casNumber,
                molecularFormula: catalog.molecularFormula,
                molecularWeight: catalog.molecularWeight,
                isControlled: catalog.isControlled,
                type: 'ROH', // Default
                materialGroup: '', // Default
                // Batch Props
                lotNumber: batch.lotNumber,
                expiryDate: batch.expiryDate || '',
                dateAcquired: batch.createdAt || new Date().toISOString(),
                unitCost: batch.unitCost,
                currency: batch.currency || 'BRL',
                itemStatus: (batch.status === 'ACTIVE' ? 'Ativo' : batch.status) as any,
                supplier: partner?.name || '',
                // Balance Props
                quantity: bal.quantity,
                location: storageAddress,
                lastUpdated: bal.updatedAt || new Date().toISOString(),
                // Audit
                createdAt: bal.createdAt,
                updatedAt: bal.updatedAt
            };
            flatItems.push(item);
        }

        // Generate History
        for (const mov of (sourceData.stock_movements as StockMovement[])) {
            const batch = batchMap.get(mov.batchId);
            const catalog = catalogMap.get(batch?.catalogId || '');

            if (!batch || !catalog) continue;

            const record: MovementRecord = {
                id: mov.id,
                itemId: '', // Not strictly linked to a balance ID
                batchId: mov.batchId,
                fromLocationId: mov.fromLocationId,
                toLocationId: mov.toLocationId,
                date: mov.createdAt,
                type: mov.type,
                productName: catalog.name,
                sapCode: catalog.sapCode,
                lot: batch.lotNumber,
                quantity: mov.quantity,
                unit: catalog.baseUnit,
                userId: mov.userId,
                observation: mov.observation
            };
            historyItems.push(record);
        }

        return { flatItems, historyItems };

    } else if (sourceData.dml) {
        console.log('DatabaseSeeder: Processando formato SQL DML...');
        const result = await DataMapper.prepareRawData(sourceData.dml);
        flatItems = result.items;
        historyItems = result.history;
    } else if (sourceData.relationalData) {
        console.log('DatabaseSeeder: Processando formato Relacional...');
        const result = await DataMapper.prepareRelationalData(sourceData as FullRelationalDumpDTO);
        flatItems = result.items;
        historyItems = result.history;
    } else if (sourceData.data && sourceData.metadata) {
        console.log('DatabaseSeeder: Processando formato Backup Nativo...');
        flatItems = sourceData.data.items || [];
        historyItems = sourceData.data.history || [];
    } else if (sourceData.dados) {
        console.log('DatabaseSeeder: Processando formato JSON Legado (dados)...');
        const result = await DataMapper.prepareRawData(sourceData.dados);
        flatItems = result.items;
        historyItems = result.history;
    }
    return { flatItems, historyItems };
};

export const seedDatabase = async (force: boolean = false, customData?: any, update: boolean = false) => {
  try {
      const count = await db.rawDb.items.count();
      if (!force && !update && count > 0) return;

      console.log('Iniciando Seeding/Restore...');
      
      let sourceData: any = customData;
      
      // 1. Tenta carregar Custom Seed (definido pelo usuário)
      if (!sourceData) {
          try {
              const customSeedConfig = await db.rawDb.systemConfigs.get('custom_seed');
              if (customSeedConfig && customSeedConfig.value) {
                  console.log('DatabaseSeeder: Usando Custom Seed definido pelo usuário.');
                  sourceData = JSON.parse(customSeedConfig.value);
              }
          } catch (e) {
              console.warn('Erro ao verificar custom_seed:', e);
          }
      }

      // 2. Fallback: Carrega o novo Seed V2 (Gerado do Excel)
      // Substitui limsData.ts como default
      if (!sourceData) {
          console.log('Carregando módulo de dados V2 (Factory Default)...');
          sourceData = seedData;
      }

      // Validate sourceData structure
      if (!sourceData) {
          console.error("Critical: sourceData is null/undefined after loading attempt.");
          sourceData = { metadata: { status: 'ERROR' }, dados: { produtos: [], lotes: [], movimentacoes: [] } };
      }

      const { flatItems, historyItems } = await processLimsData(sourceData);
      
      // Se estamos usando o formato V2 nativo, não precisamos derivar de volta via DataMapper,
      // já temos os objetos puros. Mas para garantir consistência se viermos de legacy:
      const v2Data = (sourceData.catalog && sourceData.batches)
          ? sourceData // Use raw V2 data directly if available
          : DataMapper.deriveNormalizedData(flatItems);

      if (force) {
          // Limpeza e Carga Total (Transacional) - Popula V1 e V2
          await db.transaction('rw', [
              db.rawDb.items, db.rawDb.history, db.rawDb.catalog, db.rawDb.batches, db.rawDb.partners, 
              db.rawDb.storage_locations, db.rawDb.balances, db.rawDb.stock_movements, db.rawDb.locations, db.rawDb.suppliers
          ], async () => {
              await Promise.all([
                  db.rawDb.items.clear(), db.rawDb.history.clear(), db.rawDb.catalog.clear(),
                  db.rawDb.batches.clear(), db.rawDb.partners.clear(), db.rawDb.storage_locations.clear(),
                  db.rawDb.balances.clear(), db.rawDb.stock_movements.clear()
              ]);
              
              if (flatItems.length > 0) await db.rawDb.items.bulkPut(flatItems); // Use bulkPut for safety
              if (historyItems.length > 0) await db.rawDb.history.bulkPut(historyItems);
              
              // Popula tabelas V2 para Integridade do Ledger
              if (v2Data.catalog && v2Data.catalog.length > 0) await db.rawDb.catalog.bulkPut(v2Data.catalog as CatalogProduct[]);
              if (v2Data.batches && v2Data.batches.length > 0) await db.rawDb.batches.bulkPut(v2Data.batches as InventoryBatch[]);
              if (v2Data.partners && v2Data.partners.length > 0) await db.rawDb.partners.bulkPut(v2Data.partners as BusinessPartner[]);
              if (v2Data.storage_locations && v2Data.storage_locations.length > 0) await db.rawDb.storage_locations.bulkPut(v2Data.storage_locations as StorageLocationEntity[]);
              if (v2Data.balances && v2Data.balances.length > 0) await db.rawDb.balances.bulkPut(v2Data.balances as StockBalance[]);
              if (v2Data.stock_movements && v2Data.stock_movements.length > 0) await db.rawDb.stock_movements.bulkPut(v2Data.stock_movements as StockMovement[]);
              
              console.log(`Seeding V2 Concluído: ${v2Data.catalog?.length || 0} produtos, ${v2Data.batches?.length || 0} lotes.`);
          });
      } else {
          // Importação incremental usando InventoryService otimizado
          if (flatItems.length > 0) await ImportService.importBulk(flatItems, false, update);
          if (historyItems.length > 0) await ImportService.importHistoryBulk(historyItems, false);
      }
      db.invalidateCaches();
  } catch (error) {
      console.error("CRITICAL: Falha no seed do banco de dados", error);
      throw error;
  }
};
