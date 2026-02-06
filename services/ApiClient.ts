import { GoogleSheetsService } from './GoogleSheetsService';

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

    async request(action: string, payload: any = {}): Promise<ApiResponse> {
        if (this.isElectron()) {
            try {
                // Electron IPC request
                const response = await (window as any).electronAPI.request(action, payload);
                // Ensure response structure matches Web (GAS) response
                if (!response.success && !response.error) {
                     return { success: false, error: "Unknown Electron Error" };
                }
                return response;
            } catch (error: any) {
                return { success: false, error: error.message || error.toString() };
            }
        } else {
            // Web/GAS request
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
        } else {
            return GoogleSheetsService.fetchFullDatabase();
        }
    }
};
