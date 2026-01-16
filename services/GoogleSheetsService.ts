
import { GOOGLE_CONFIG } from '../config/apiConfig';
import { InventoryItem, MovementRecord, CatalogProduct, InventoryBatch, StockBalance } from '../types';

interface GasResponse {
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

export const GoogleSheetsService = {
    
    getUrl() {
        const url = GOOGLE_CONFIG.getWebUrl();
        if (!url) throw new Error("URL do Google Web App não configurada. Vá em Configurações.");
        return url;
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

    async request(action: string, payload: any = {}): Promise<GasResponse> {
        const url = this.getUrl();
        try {
            const response = await this.fetchWithRetry(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action, ...payload })
            });

            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error("Resposta inválida do servidor (HTML retornada ao invés de JSON).");
            }
        } catch (error: any) {
            console.error(`[GoogleSheets] Erro na ação ${action}:`, error);
            throw error;
        }
    },

    async testConnection(): Promise<boolean> {
        try {
            const res = await this.request('ping');
            return res.success === true;
        } catch (e) {
            return false;
        }
    },

    // --- SYNC OPERATIONS ---

    async fetchInventory(): Promise<InventoryItem[]> {
        const res = await this.request('read_inventory');
        if (!res.success || !Array.isArray(res.data)) {
            return [];
        }
        return res.data;
    },

    async fetchFullDatabase(): Promise<FullDatabasePayload> {
        const res = await this.request('read_full_db');
        if (!res.success || !res.data) {
            throw new Error("Falha ao baixar banco de dados completo.");
        }
        return {
            view: Array.isArray(res.data.view) ? res.data.view : [],
            catalog: Array.isArray(res.data.catalog) ? res.data.catalog : [],
            batches: Array.isArray(res.data.batches) ? res.data.batches : [],
            balances: Array.isArray(res.data.balances) ? res.data.balances : []
        };
    },

    async addOrUpdateItem(item: InventoryItem): Promise<void> {
        await this.request('upsert_item', { item });
    },

    async deleteItem(itemId: string): Promise<void> {
        await this.request('delete_item', { id: itemId });
    },

    async logMovement(record: MovementRecord): Promise<void> {
        await this.request('log_movement', { record });
    }
};
