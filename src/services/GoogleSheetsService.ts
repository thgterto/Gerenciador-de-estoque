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
        // Não lançar erro aqui, retornar null para ser tratado pelo caller
        return url;
    },

    isConfigured() {
        // If running in Electron, we are always "configured" via local DB
        if (typeof window !== 'undefined' && window.electronAPI) {
            return true;
        }
        return !!GOOGLE_CONFIG.getWebUrl();
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
        // 1. Electron IPC Priority
        if (typeof window !== 'undefined' && window.electronAPI) {
            try {
                const response = await window.electronAPI.request(action, payload);
                return response;
            } catch (error: any) {
                console.error(`[Electron] Error in ${action}:`, error);
                return { success: false, error: error.toString() };
            }
        }

        // 2. Google Sheets Fallback
        if (!this.isConfigured()) {
            // Silenciosamente ignora requisições se não estiver configurado
            // Retorna falso sucesso para não quebrar a UI
            return { success: false, message: "Service not configured (Offline Mode)" };
        }

        const url = this.getUrl();
        if (!url) return { success: false, message: "URL Missing" };

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
            // Propaga erro apenas se for crítico, senão falha silenciosa para não travar UI
            throw error;
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
        if (!this.isConfigured()) throw new Error("Google Sheets não configurado.");
        
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
