import { ExcelIntegrationService } from './ExcelIntegrationService';
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

    // Simple heuristic: if not Electron and not Excel (implied by ExcelIntegrationService config), try Server
    // Or if running on localhost:3000 (default server port) or if specific API endpoint exists
    isServerMode(): boolean {
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
                // If logMovement expects MovementRecord, payload might have 'record' key
                const record = payload.record || payload;
                return RestApiService.logTransaction(record);
            }
            if (action === 'upsert_item') {
                 const item = payload.item || payload;
                 return RestApiService.saveProduct(item);
            }
            if (action === 'delete_item') {
                 return { success: false, error: "Delete not supported in Server Mode yet." };
            }
            // For general requests, fallback or error
            return { success: false, error: `Action ${action} not supported in Server Mode` };
        } else {
            // Web/Excel request
            return ExcelIntegrationService.request(action, payload);
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
        } else {
            return ExcelIntegrationService.fetchFullDatabase();
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
