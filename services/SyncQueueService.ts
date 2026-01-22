
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
            
            for (const item of pendingItems) {
                try {
                    const res = await GoogleSheetsService.request(item.action, item.payload);
                    
                    if (res.success) {
                        await db.rawDb.syncQueue.delete(item.id!);
                        console.log(`[SyncQueue] Item ${item.id} processed successfully`);
                    } else {
                        throw new Error(res.message || "Unknown error");
                    }
                } catch (error) {
                    console.warn(`[SyncQueue] Item ${item.id} failed:`, error);
                    // Increment retry or delete if fatal
                    if (item.retryCount >= 5) {
                        console.error(`[SyncQueue] Item ${item.id} max retries reached. Deleting.`);
                         await db.rawDb.syncQueue.delete(item.id!);
                    } else {
                        await db.rawDb.syncQueue.update(item.id!, { 
                            retryCount: item.retryCount + 1,
                            error: String(error)
                        });
                        // Stop processing batch on first failure to maintain order consistency
                        break;
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
