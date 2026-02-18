
import { InventoryItem } from '../types';

interface ServerResponse {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
}

export const RestApiService = {
    baseUrl: '/api',

    async request(method: string, endpoint: string, body?: any): Promise<ServerResponse> {
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            const config: RequestInit = {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            };

            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            if (!response.ok) {
                 const text = await response.text();
                 try {
                     const json = JSON.parse(text);
                     return { success: false, error: json.error || `HTTP Error ${response.status}` };
                 } catch (e) {
                     return { success: false, error: `HTTP Error ${response.status}: ${text}` };
                 }
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async fetchFullDatabase() {
        // Map backend GetInventory to frontend expected format
        const response = await this.request('GET', '/inventory');
        if (!response.success) throw new Error(response.error);

        // Backend returns InventoryItemDTO[], we need to map to InventoryItem if needed
        // Assuming backend returns array of objects similar to InventoryItem
        const items = response.data;

        // Current backend implementation of GetInventory returns { product, currentStock, status }
        // We need to map this to InventoryItem structure expected by frontend
        const view: InventoryItem[] = items.map((item: any) => ({
            id: item.product.id,
            sapCode: item.product.sku,
            name: item.product.name,
            minStockLevel: item.product.min_stock,
            quantity: item.currentStock,
            itemStatus: item.status === 'OK' ? 'Ativo' : (item.status === 'CRITICAL' ? 'Bloqueado' : 'Quarentena'), // Mapping logic
            // Default/Mock values for missing fields
            lotNumber: 'N/A',
            expiryDate: '',
            dateAcquired: '',
            unitCost: 0,
            currency: 'BRL',
            supplier: 'Unknown',
            location: { warehouse: 'Main', cabinet: '', shelf: '', position: '' },
            lastUpdated: new Date().toISOString(),
            baseUnit: 'UN',
            category: 'Geral',
            type: 'ROH',
            materialGroup: '',
            isControlled: false,
            risks: { O:false, T:false, T_PLUS:false, C:false, E:false, N:false, Xn:false, Xi:false, F:false, F_PLUS:false }
        }));

        return {
            view,
            catalog: [],
            batches: [],
            balances: []
        };
    },

    async logTransaction(transaction: any) {
         // Map to LogTransactionRequest
         // Transaction here might be MovementRecord or similar
         // Backend expects { productId, type, qty, user }
         const payload = {
             productId: transaction.itemId, // Assuming itemId maps to product id
             type: transaction.type === 'ENTRADA' ? 'IN' : (transaction.type === 'SAIDA' ? 'OUT' : 'ADJUST'),
             qty: transaction.quantity,
             user: transaction.userId || 'System'
         };
         return this.request('POST', '/inventory/transaction', payload);
    },

    async saveProduct(product: any) {
        return this.request('POST', '/inventory/product', product);
    }
};
