import { db } from '../db';
import { GoogleSheetsService } from './GoogleSheetsService';
import { SyncQueueService } from './SyncQueueService';

export const InventorySyncManager = {
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

    async notifyChange(action: string, payload: any): Promise<void> {
        if (GoogleSheetsService.isConfigured()) {
            GoogleSheetsService.request(action, payload)
                .catch(() => SyncQueueService.enqueue(action, payload));
        }
    },

    // Wrapper for legacy addOrUpdateItem pattern
    async notifyItemChange(item: any): Promise<void> {
        if (GoogleSheetsService.isConfigured()) {
            GoogleSheetsService.addOrUpdateItem(item)
                .catch(() => SyncQueueService.enqueue('upsert_item', { item }));
        }
    },

    // Wrapper for legacy deleteItem pattern
    async notifyItemDelete(id: string): Promise<void> {
        if (GoogleSheetsService.isConfigured()) {
            GoogleSheetsService.deleteItem(id)
                .catch(() => SyncQueueService.enqueue('delete_item', { id }));
        }
    }
};
