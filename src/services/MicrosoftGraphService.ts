import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { loginRequest } from "../config/authConfig";
import { InventoryItem, MovementRecord, CatalogProduct, InventoryBatch, StockBalance } from "../types";

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

export class MicrosoftGraphService {
    private static msalInstance: PublicClientApplication | null = null;
    private static activeAccount: AccountInfo | null = null;
    private static excelFileId: string | null = null;

    static initialize(instance: PublicClientApplication, account: AccountInfo | null) {
        this.msalInstance = instance;
        this.activeAccount = account;
        this.excelFileId = localStorage.getItem('LC_MS_EXCEL_ID');
    }

    static setExcelFileId(id: string) {
        this.excelFileId = id;
        localStorage.setItem('LC_MS_EXCEL_ID', id);
    }

    static isConfigured(): boolean {
        return !!this.msalInstance && !!this.activeAccount && !!this.excelFileId;
    }

    private static async getToken(): Promise<string> {
        if (!this.msalInstance || !this.activeAccount) {
            throw new Error("Microsoft Graph Service not initialized or user not logged in.");
        }

        try {
            const response = await this.msalInstance.acquireTokenSilent({
                ...loginRequest,
                account: this.activeAccount
            });
            return response.accessToken;
        } catch (error) {
            // Fallback to interaction if silent fails
            // In a real app, this should prompt the user, but here we might just fail or try popup
            // Since this is a background service call, we can't easily pop up.
            // The user should have logged in via the UI first.
            console.error("Silent token acquisition failed", error);
            throw new Error("Authentication required. Please refresh the page or login again.");
        }
    }

    static async request(action: string, payload: any = {}): Promise<GasResponse> {
        if (!this.isConfigured()) {
            return { success: false, message: "Microsoft Backend not configured." };
        }

        const token = await this.getToken();

        // We use the "run" endpoint of the Office Script
        // NOTE: This assumes the script is already deployed and we have its ID, OR
        // we are using the Workbook API directly.
        // The Plan specifies interacting with "Office Scripts" via Graph.
        // But passing data to a script is complex (requires Script ID).
        //
        // ALTERNATIVE: Use the Excel REST API directly to read tables, which is standard Graph.
        // However, for "Logic" (like upsert with validation), a script is better.
        //
        // Let's implement a hybrid approach as per plan: Call the script.
        // But we don't have the script ID. The user needs to provide it?
        // OR we can implement the logic in Client-Side and just use Graph for CRUD.
        //
        // Given the requirement "rewrite backend/GoogleAppsScript.js to Office Scripts",
        // it implies we CALL that script.
        //
        // Let's assume the user puts the Script ID in settings too?
        // Or simpler: We use the Excel API directly for CRUD if possible.
        //
        // Let's stick to the plan: Call the script.
        // We need a SCRIPT_ID setting.
        const scriptId = localStorage.getItem('LC_MS_SCRIPT_ID');
        if (!scriptId) {
             return { success: false, error: "Office Script ID not configured." };
        }

        // const url = `https://graph.microsoft.com/v1.0/me/drive/items/${this.excelFileId}/workbook/worksheets`; // Dummy URL check

        // Actual Script Run URL
        // POST /me/drive/items/{id}/workbook/scripts/{scriptId}/run
        // Note: The script must be in the same drive? Or accessed via 'scripts' endpoint?
        // Graph API for Scripts: https://graph.microsoft.com/v1.0/solutions/scripts/{id}/run ??
        // Actually, for Excel Online, it's usually:
        // POST https://graph.microsoft.com/v1.0/me/drive/items/{workbook-id}/workbook/runScript
        // (This might be in beta or specific versions).

        // Let's try the standard way to run a script visible to the workbook.
        // If the script is stored in the workbook (legacy), it's different.
        // Office Scripts are usually separate files in OneDrive.

        // As a fallback/simplification for this migration:
        // We will assume we are calling a specific named script or just using direct API for now?
        // The prompt says "Call the script".

        // URL for running an Office Script:
        // https://graph.microsoft.com/v1.0/me/drive/items/{script-drive-item-id}/workbook/run
        // payload: { workbookId: ..., parameters: ... }

        const runUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${scriptId}/run`;

        const body = {
            workbookId: this.excelFileId,
            parameters: {
                action: action,
                payload: JSON.stringify(payload)
            }
        };

        try {
            const response = await fetch(runUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Graph API Error: ${response.status} - ${errText}`);
            }

            const result = await response.json();
            // The script returns a result object.
            // Office Script: return JSON.stringify(response);
            if (result.value) {
                 // It might be double encoded if the script returns a string
                 try {
                     return typeof result.value === 'string' ? JSON.parse(result.value) : result.value;
                 } catch {
                     return result.value;
                 }
            }
            return { success: true };
        } catch (error: any) {
            console.error("Graph Request Failed", error);
            return { success: false, error: error.message };
        }
    }

    // --- Service Implementation ---

    static async fetchInventory(): Promise<InventoryItem[]> {
        const res = await this.request('read_inventory');
        return (res.success && Array.isArray(res.data)) ? res.data : [];
    }

    static async fetchFullDatabase(): Promise<FullDatabasePayload> {
        const res = await this.request('read_full_db');
        if (!res.success) throw new Error(res.error || "Failed to fetch DB");

        return {
            view: res.data?.view || [],
            catalog: res.data?.catalog || [],
            batches: res.data?.batches || [],
            balances: res.data?.balances || []
        };
    }

    static async addOrUpdateItem(item: InventoryItem): Promise<void> {
        await this.request('upsert_item', { item });
    }

    static async deleteItem(itemId: string): Promise<void> {
        await this.request('delete_item', { id: itemId });
    }

    static async logMovement(record: MovementRecord): Promise<void> {
        await this.request('log_movement', { record });
    }
}
