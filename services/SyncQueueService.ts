
import { db } from '../db';
import { GoogleSheetsService } from './GoogleSheetsService';

export const SyncQueueService = {
    
    // Interval ID storage to prevent duplicate timers
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
            this.triggerProcess(); // Try immediately
        } catch (e) {
            console.error("[SyncQueue] Failed to enqueue:", e);
        }
    },

    async getQueueSize(): Promise<number> {
        return await db.rawDb.syncQueue.count();
    },

    async processQueue() {
        // Prevent concurrent processing check (simple lock via memory, not tab-safe but OK for now)
        if ((window as any)._isSyncing) return;
        (window as any)._isSyncing = true;

        try {
            const count = await this.getQueueSize();
            if (count === 0) return;

            // Check connection first
            if (!GoogleSheetsService.isConfigured()) return;
            // Simple ping check logic implied by calling request
            
            // Fetch pending items (FIFO)
            const pendingItems = await db.rawDb.syncQueue.orderBy('id').limit(5).toArray();
            
            if (pendingItems.length === 0) return;

            // Prepare batch request
            const batchPayload = {
                operations: pendingItems.map(item => ({
                    id: item.id,
                    action: item.action,
                    payload: item.payload
                }))
            };

            try {
                // Execute batch request
                const res = await GoogleSheetsService.request('batch_request', batchPayload);

                if (res.success && Array.isArray(res.data)) {
                    // Process results
                    for (const result of res.data) {
                        const item = pendingItems.find(p => p.id === result.id);
                        if (!item) continue;

                        if (result.success) {
                            await db.rawDb.syncQueue.delete(result.id);
                            console.log(`[SyncQueue] Item ${result.id} processed successfully`);
                        } else {
                            console.warn(`[SyncQueue] Item ${result.id} failed:`, result.error);

                            if (item.retryCount >= 5) {
                                console.error(`[SyncQueue] Item ${result.id} max retries reached. Deleting.`);
                                await db.rawDb.syncQueue.delete(result.id);
                            } else {
                                await db.rawDb.syncQueue.update(result.id, {
                                    retryCount: item.retryCount + 1,
                                    error: String(result.error)
                                });
                            }
                        }
                    }
                } else {
                    throw new Error(res.message || "Batch request returned invalid data");
                }
            } catch (error) {
                console.warn(`[SyncQueue] Batch request failed:`, error);
                // In case of network error or total failure, apply retry logic to the first item
                // so we don't get stuck in a loop without backoff/max-retry handling
                const firstItem = pendingItems[0];
                if (firstItem) {
                     if (firstItem.retryCount >= 5) {
                        await db.rawDb.syncQueue.delete(firstItem.id!);
                     } else {
                        await db.rawDb.syncQueue.update(firstItem.id!, {
                            retryCount: firstItem.retryCount + 1,
                            error: String(error)
                        });
                     }
                }
            }
        } finally {
            (window as any)._isSyncing = false;
        }
    },

    triggerProcess() {
        // Debounce trigger
        if ((window as any)._syncTimer) clearTimeout((window as any)._syncTimer);
        (window as any)._syncTimer = setTimeout(() => this.processQueue(), 2000);
    },

    startAutoSync(intervalMs = 30000) {
        // Clear existing interval if any
        this.stopAutoSync();
        
        // Start new interval
        this._intervalId = window.setInterval(() => this.processQueue(), intervalMs);
        
        // Listen for online event (Singleton listener)
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
