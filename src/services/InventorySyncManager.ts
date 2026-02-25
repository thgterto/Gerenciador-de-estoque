import { db } from '../db';
import { ApiClient } from './ApiClient';
import { SyncQueueService } from './SyncQueueService';
import { ExcelIntegrationService } from './ExcelIntegrationService';

export const InventorySyncManager = {
    async syncFromCloud(): Promise<void> {
      try {
          // If NOT Electron and NOT configured, skip
          // If Electron, we always "configured" (local DB)
          if (!ApiClient.isElectron() && !(ExcelIntegrationService.isConfigured())) {
              console.log("Modo Offline: Excel Integration não configurado.");
              return;
          }

          // Check for pending offline changes to prevent overwrite
          const pendingCount = await SyncQueueService.getQueueSize();
          if (pendingCount > 0) {
              console.warn(`[Sync] Aborted: ${pendingCount} offline changes pending. Triggering push first.`);
              SyncQueueService.triggerProcess();
              return;
          }

          console.log("Iniciando sincronização (Hybrid/Portable)...");

          // Use ExcelService for Web, ApiClient for Electron (if different)
          // Actually ApiClient handles Electron logic internally.
          // But for Web, we now use ExcelIntegrationService.
          let view, catalog, batches, balances;

          if (ApiClient.isElectron()) {
               const data = await ApiClient.fetchFullDatabase();
               view = data.view;
               catalog = data.catalog;
               batches = data.batches;
               balances = data.balances;
          } else {
               const data = await ExcelIntegrationService.fetchFullDatabase();
               view = data.view;
               catalog = data.catalog;
               batches = data.batches;
               balances = data.balances;
          }

          if (view && view.length > 0) {
              // Atomic Transaction
              await db.transaction('rw', [db.rawDb.items, db.rawDb.catalog, db.rawDb.batches, db.rawDb.balances], async () => {
                  await Promise.all([
                      // db.items.clear(), // Optional: clear or upsert
                      db.items.bulkPut(view),
                      db.rawDb.catalog.bulkPut(catalog),
                      db.rawDb.batches.bulkPut(batches),
                      db.rawDb.balances.bulkPut(balances)
                  ]);
              });
              console.log(`Sync Concluído: ${view.length} items atualizados.`);
          }
      } catch (error) {
          console.error("Erro na sincronização:", error);
          // Invalidate cache on sync error to ensure consistency
          db.invalidateCaches();
      }
    },

    async notifyChange(action: string, payload: any): Promise<void> {
        if (ApiClient.isElectron()) {
            ApiClient.request(action, payload)
                .catch(() => SyncQueueService.enqueue(action, payload));
        } else if (ExcelIntegrationService.isConfigured()) {
            ExcelIntegrationService.request(action, payload)
                .catch(() => SyncQueueService.enqueue(action, payload));
        }
    },

    async notifyItemChange(item: any): Promise<void> {
        if (ApiClient.isElectron()) {
             ApiClient.request('upsert_item', { item })
                .catch(() => SyncQueueService.enqueue('upsert_item', { item }));
        } else if (ExcelIntegrationService.isConfigured()) {
             ExcelIntegrationService.request('upsert_item', { item })
                .catch(() => SyncQueueService.enqueue('upsert_item', { item }));
        }
    },

    async notifyItemDelete(id: string): Promise<void> {
        if (ApiClient.isElectron()) {
             ApiClient.request('delete_item', { id })
                .catch(() => SyncQueueService.enqueue('delete_item', { id }));
        } else if (ExcelIntegrationService.isConfigured()) {
             ExcelIntegrationService.request('delete_item', { id })
                .catch(() => SyncQueueService.enqueue('delete_item', { id }));
        }
    }
};
