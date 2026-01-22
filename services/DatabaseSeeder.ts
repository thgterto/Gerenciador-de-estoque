
import { db } from '../db';
import { InventoryItem, MovementRecord, FullRelationalDumpDTO } from '../types';
import { ImportService } from './ImportService';
import { DataMapper } from '../utils/parsers/DataMapper';

export const processLimsData = async (sourceData: any) => {
    let flatItems: InventoryItem[] = [];
    let historyItems: MovementRecord[] = [];

    if (sourceData.dml) {
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
              console.warn('Falha ao carregar limsData padrão. O sistema iniciará vazio.', e);
              sourceData = { metadata: { status: 'EMPTY' }, dados: { produtos: [], lotes: [], movimentacoes: [] } };
          }
      }

      // Validate sourceData structure
      if (!sourceData) {
          console.error("Critical: sourceData is null/undefined after loading attempt.");
          sourceData = { metadata: { status: 'ERROR' }, dados: { produtos: [], lotes: [], movimentacoes: [] } };
      }

      const { flatItems, historyItems } = await processLimsData(sourceData);
      
      // Normalização V2 (Usa os IDs determinísticos já gerados no parser)
      // Esta etapa é CRUCIAL para garantir que o Ledger V2 seja populado
      const v2Data = DataMapper.deriveNormalizedData(flatItems);

      if (force) {
          // Limpeza e Carga Total (Transacional) - Popula V1 e V2
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
              
              // Popula tabelas V2 para Integridade do Ledger
              if (v2Data.catalog.length > 0) await db.rawDb.catalog.bulkAdd(v2Data.catalog);
              if (v2Data.batches.length > 0) await db.rawDb.batches.bulkAdd(v2Data.batches);
              if (v2Data.partners.length > 0) await db.rawDb.partners.bulkAdd(v2Data.partners);
              if (v2Data.locations.length > 0) await db.rawDb.storage_locations.bulkAdd(v2Data.locations);
              if (v2Data.balances.length > 0) await db.rawDb.balances.bulkAdd(v2Data.balances);
              
              console.log(`Seeding V2 Concluído: ${v2Data.catalog.length} produtos, ${v2Data.batches.length} lotes.`);
          });
      } else {
          // Importação incremental usando InventoryService otimizado
          if (flatItems.length > 0) await ImportService.importBulk(flatItems);
          if (historyItems.length > 0) await ImportService.importHistoryBulk(historyItems, false);
      }
      db.invalidateCaches();
  } catch (error) {
      console.error("CRITICAL: Falha no seed do banco de dados", error);
      throw error;
  }
};
