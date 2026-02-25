import { EXCEL_CONFIG } from '../config/apiConfig';
import { InventoryItem, MovementRecord, CatalogProduct, InventoryBatch, StockBalance } from '../types';

interface ExcelResponse {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
}

interface FullDatabasePayload {
    view: InventoryItem[];
    catalog: CatalogProduct[];
    batches: InventoryBatch[];
    balances: StockBalance[];
}

export const ExcelIntegrationService = {
    
    getWebhookUrl() {
        return EXCEL_CONFIG.getWebhookUrl();
    },

    isConfigured() {
        return !!EXCEL_CONFIG.getWebhookUrl();
    },

    async fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status >= 500 && retries > 0) throw new Error(`Server Error: ${response.status}`);
                return response;
            }
            return response;
        } catch (err) {
            if (retries <= 0) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.fetchWithRetry(url, options, retries - 1, delay * 2);
        }
    },

    async request(action: string, payload: any = {}): Promise<ExcelResponse> {
        if (!this.isConfigured()) {
            return { success: false, message: "Service not configured (Offline Mode)" };
        }

        const url = this.getWebhookUrl();
        if (!url) return { success: false, message: "Webhook URL Missing" };

        try {
            const response = await this.fetchWithRetry(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...payload })
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            // Power Automate might return different structures, we expect JSON
            const json = await response.json();
            return json;
        } catch (error: any) {
            console.error(`[Excel] Error in ${action}:`, error);
            return { success: false, error: error.toString() };
        }
    },

    async testConnection(): Promise<boolean> {
        try {
            if (!this.isConfigured()) return false;
            const res = await this.request('ping');
            return res.success === true;
        } catch (e) {
            return false;
        }
    },

    // --- SYNC OPERATIONS ---

    async fetchInventory(): Promise<InventoryItem[]> {
        if (!this.isConfigured()) return [];
        const res = await this.request('read_inventory');
        if (!res.success || !Array.isArray(res.data)) {
            return [];
        }
        return res.data;
    },

    async fetchFullDatabase(): Promise<FullDatabasePayload> {
        if (!this.isConfigured()) throw new Error("Excel Integration not configured.");
        
        const res = await this.request('read_full_db');
        if (!res.success || !res.data) {
            throw new Error("Failed to download full database.");
        }
        return {
            view: Array.isArray(res.data.view) ? res.data.view : [],
            catalog: Array.isArray(res.data.catalog) ? res.data.catalog : [],
            batches: Array.isArray(res.data.batches) ? res.data.batches : [],
            balances: Array.isArray(res.data.balances) ? res.data.balances : []
        };
    },

    async addOrUpdateItem(item: InventoryItem): Promise<void> {
        if (!this.isConfigured()) return;
        await this.request('upsert_item', { item });
    },

    async deleteItem(itemId: string): Promise<void> {
        if (!this.isConfigured()) return;
        await this.request('delete_item', { id: itemId });
    },

    async logMovement(record: MovementRecord): Promise<void> {
        if (!this.isConfigured()) return;
        await this.request('log_movement', { record });
    }
};
