import { db } from '../db';
import { ApiClient } from './ApiClient';
import { SyncQueueService } from './SyncQueueService';
import { GoogleSheetsService } from './GoogleSheetsService';

export const InventorySyncManager = {
    async syncFromCloud(): Promise<void> {
      try {
          // If NOT Electron and NOT configured, skip
          // If Electron, we always "configured" (local DB)
          if (!ApiClient.isElectron() && !(await isGasConfigured())) {
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

          console.log("Iniciando sincronização (Hybrid/Portable)...");

          const { view, catalog, batches, balances } = await ApiClient.fetchFullDatabase();

          if (view && view.length > 0) {
              // Atomic Transaction
              await db.transaction('rw', [db.rawDb.items, db.rawDb.catalog, db.rawDb.batches, db.rawDb.balances], async () => {
                  await Promise.all([
                      db.items.clear(), // Clear old cache? Or upsert?
                      // Usually we might want to clear or smart merge.
                      // For "read_full_db" usually it's a replace or we trust the source.
                      // Let's stick to bulkPut which upserts.
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
        // In Electron, we always request. In Web, check config.
        if (ApiClient.isElectron() || (await isGasConfigured())) {
            ApiClient.request(action, payload)
                .catch(() => SyncQueueService.enqueue(action, payload));
        }
    },

    // Wrapper for legacy addOrUpdateItem pattern
    async notifyItemChange(item: any): Promise<void> {
        if (ApiClient.isElectron() || (await isGasConfigured())) {
             // ApiClient.request('upsert_item', { item })
             // Legacy GoogleSheetsService had addOrUpdateItem wrapper.
             // We can use request directly.
             ApiClient.request('upsert_item', { item })
                .catch(() => SyncQueueService.enqueue('upsert_item', { item }));
        }
    },

    // Wrapper for legacy deleteItem pattern
    async notifyItemDelete(id: string): Promise<void> {
        if (ApiClient.isElectron() || (await isGasConfigured())) {
             ApiClient.request('delete_item', { id })
                .catch(() => SyncQueueService.enqueue('delete_item', { id }));
        }
    }
};

// Helper to check GAS config (mock or import from service if needed)
async function isGasConfigured(): Promise<boolean> {
    return GoogleSheetsService.isConfigured();
}
