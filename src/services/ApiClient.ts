import { GoogleSheetsService } from './GoogleSheetsService';
import { MicrosoftGraphService } from './MicrosoftGraphService';
import { RestApiService } from './RestApiService';

export interface ApiResponse {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
}

export const ApiClient = {
    isOnline(): boolean {
        return navigator.onLine;
    },

    isElectron(): boolean {
        return !!(window as any).electronAPI;
    },

    isServerMode(): boolean {
        // Check if running on localhost:3000 (default server port) or if specific API endpoint exists
        // Simple heuristic: if not Electron and not GAS (implied by GoogleSheetsService config), try Server
        return !this.isElectron() && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    },

    async request(action: string, payload: any = {}): Promise<ApiResponse> {
        if (this.isElectron()) {
            try {
                // Electron IPC request
                const response = await (window as any).electronAPI.request(action, payload);
                if (!response.success && !response.error) {
                     return { success: false, error: "Unknown Electron Error" };
                }
                return response;
            } catch (error: any) {
                return { success: false, error: error.message || error.toString() };
            }
        } else if (this.isServerMode()) {
            // Map legacy actions to REST API
            if (action === 'read_full_db') {
                 try {
                     const data = await RestApiService.fetchFullDatabase();
                     return { success: true, data };
                 } catch (e: any) {
                     return { success: false, error: e.message };
                 }
            }
            if (action === 'log_movement') {
                return RestApiService.logTransaction(payload.record);
            }
            if (action === 'upsert_item') {
                 // Map InventoryItem to SaveProductRequest
                 const item = payload.item;
                 const productRequest = {
                     id: item.id, // Ideally UUID, but might be legacy ID. Backend expects UUID optional.
                     sku: item.sapCode,
                     name: item.name,
                     min_stock: Number(item.minStockLevel) || 0,
                     safety_stock: 0 // Not present in V1 item
                 };
                 // If ID is not UUID format, backend might reject or create new.
                 // Backend schema: id TEXT PRIMARY KEY. So any string is fine if consistent.
                 // Zod validation in controller expects UUID for `id` if present.
                 // If legacy ID is not UUID, we might have issues.
                 // Let's assume legacy IDs are not UUIDs and let backend generate new ID if we don't pass one,
                 // BUT this creates dupes if we edit.
                 // Ideally backend should accept any string ID or we migrate IDs.
                 // For now, pass it if it looks like UUID, else undefined (create new)?
                 // Or better: update controller to accept string ID (not just UUID).

                 // However, Zod schema in InventoryController.ts: id: z.string().uuid().optional()
                 // I should update controller to allow non-UUID IDs if I want to support legacy IDs.

                 return RestApiService.saveProduct(productRequest);
            }
            if (action === 'delete_item') {
                 // Not implemented in backend yet
                 return { success: false, error: "Delete not supported in Server Mode yet." };
            }
            return { success: false, error: `Action ${action} not supported in Server Mode` };
        } else if (MicrosoftGraphService.isConfigured()) {
            return MicrosoftGraphService.request(action, payload);
        } else {
            // Web/GAS request (Default Fallback)
            return GoogleSheetsService.request(action, payload);
        }
    },

    async fetchFullDatabase() {
        if (this.isElectron()) {
            const res = await this.request('read_full_db');
            if (res.success && res.data) {
                return res.data; // { view, catalog, batches, balances }
            }
            throw new Error(res.error || "Failed to fetch full DB from Electron");
        } else if (this.isServerMode()) {
            return RestApiService.fetchFullDatabase();
        } else if (MicrosoftGraphService.isConfigured()) {
            return MicrosoftGraphService.fetchFullDatabase();
        } else {
            return GoogleSheetsService.fetchFullDatabase();
        }
    },

    async backupDatabase(): Promise<ApiResponse> {
        if (this.isElectron()) {
            return this.request('db:backup');
        } else {
             return { success: false, error: "Backup completo disponível apenas na versão Desktop/Portátil." };
        }
    }
};
