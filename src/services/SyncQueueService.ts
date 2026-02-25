import { db } from '../db';
import { ExcelIntegrationService } from './ExcelIntegrationService';

interface SyncQueueItem {
    id?: number;
    action: string;
    payload: any;
    timestamp: number;
    retryCount: number;
    error?: string;
}

export const SyncQueueService = {
    
    _intervalId: null as number | null,

    async enqueue(action: string, payload: any) {
        try {
            await db.rawDb.syncQueue.add({
                action,
                payload,
                timestamp: Date.now(),
                retryCount: 0
            });
            console.log(`[SyncQueue] Action ${action} enqueued (Offline Mode)`);
            this.triggerProcess();
        } catch (e) {
            console.error("[SyncQueue] Failed to enqueue:", e);
        }
    },

    async getQueueSize(): Promise<number> {
        return await db.rawDb.syncQueue.count();
    },

    async processQueue() {
        if ((window as any)._isSyncing) return;
        (window as any)._isSyncing = true;

        try {
            const count = await this.getQueueSize();
            if (count === 0) return;

            if (!ExcelIntegrationService.isConfigured()) return;
            
            const pendingItems = await db.rawDb.syncQueue.orderBy('id').limit(5).toArray();
            
            if (pendingItems.length === 0) return;

            // Excel/Power Automate might not support batching the same way GAS did.
            // We will process items one by one for now to ensure reliability with Webhooks.
            // Or we can send a batch if the webhook supports it.
            // Let's process sequentially for safety.

            for (const item of pendingItems) {
                try {
                    const res = await ExcelIntegrationService.request(item.action, item.payload);

                    if (res.success) {
                        if (item.id) await db.rawDb.syncQueue.delete(item.id);
                        console.log(`[SyncQueue] Item ${item.id} processed successfully`);
                    } else {
                        console.warn(`[SyncQueue] Item ${item.id} failed:`, res.error);
                        if (item.retryCount >= 5) {
                            if (item.id) await db.rawDb.syncQueue.delete(item.id);
                        } else {
                            if (item.id) {
                                await db.rawDb.syncQueue.update(item.id, {
                                    retryCount: item.retryCount + 1,
                                    error: String(res.error)
                                });
                            }
                        }
                    }
                } catch (error) {
                     console.error(`[SyncQueue] Request failed for ${item.id}:`, error);
                     if (item.retryCount >= 5) {
                        if (item.id) await db.rawDb.syncQueue.delete(item.id);
                     } else {
                        if (item.id) {
                            await db.rawDb.syncQueue.update(item.id, {
                                retryCount: item.retryCount + 1,
                                error: String(error)
                            });
                        }
                     }
                }
            }
        } finally {
            (window as any)._isSyncing = false;
        }
    },

    triggerProcess() {
        if ((window as any)._syncTimer) clearTimeout((window as any)._syncTimer);
        (window as any)._syncTimer = setTimeout(() => this.processQueue(), 2000);
    },

    startAutoSync(intervalMs = 30000) {
        this.stopAutoSync();
        this._intervalId = window.setInterval(() => this.processQueue(), intervalMs);
        
        if (!(window as any)._syncOnlineListener) {
            (window as any)._syncOnlineListener = () => {
                console.log("[SyncQueue] Online detected. Processing queue...");
                this.processQueue();
            };
            window.addEventListener('online', (window as any)._syncOnlineListener);
        }
    },

    stopAutoSync() {
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }
};
