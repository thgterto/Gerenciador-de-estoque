
import { PublicClientApplication } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";
import { msalConfig, loginRequest, SHAREPOINT_CONFIG } from '../config/authConfig';
import { InventoryItem, MovementRecord } from '../types';

// Singleton MSAL Instance
const msalInstance = new PublicClientApplication(msalConfig);
let graphClient: Client | undefined;
let isInitialized = false;

export const SharePointService = {
    
    async initialize() {
        if (!isInitialized) {
            await msalInstance.initialize();
            isInitialized = true;
        }

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
            msalInstance.setActiveAccount(accounts[0]);
        }
    },

    isAuthenticated() {
        return !!msalInstance.getActiveAccount();
    },

    async login() {
        await this.initialize();
        try {
            const response = await msalInstance.loginPopup(loginRequest);
            msalInstance.setActiveAccount(response.account);
            graphClient = undefined;
            return response.account;
        } catch (error: any) {
            // Ignora log de erro se for cancelamento do usuário
            if (error.errorCode !== 'user_cancelled') {
                console.error("Login falhou", error);
            }
            throw error;
        }
    },

    async logout() {
        await this.initialize();
        await msalInstance.logoutPopup();
        graphClient = undefined;
    },

    async getClient() {
        await this.initialize();
        
        if (graphClient) return graphClient;

        const account = msalInstance.getActiveAccount();
        if (!account) throw new Error("Usuário não autenticado no Microsoft 365");

        const authProvider = async (callback: (error: any, accessToken: string | null) => void) => {
            try {
                const response = await msalInstance.acquireTokenSilent({
                    ...loginRequest,
                    account: account
                });
                callback(null, response.accessToken);
            } catch (error) {
                try {
                    const response = await msalInstance.acquireTokenPopup(loginRequest);
                    callback(null, response.accessToken);
                } catch (err) {
                    callback(err, null);
                }
            }
        };

        graphClient = Client.init({ authProvider });
        return graphClient;
    },

    // --- PROVISIONING (SETUP BACKEND) ---

    async provisionBackend(onProgress: (status: string) => void): Promise<void> {
        const client = await this.getClient();
        const siteId = SHAREPOINT_CONFIG.siteId;

        // 1. Criar Lista de Inventário
        onProgress("Verificando lista de Inventário...");
        await this.ensureList(client, siteId, SHAREPOINT_CONFIG.lists.inventory, {
            description: "LabControl - Tabela Principal de Estoque",
            list: { template: "genericList" }
        }, [
            { name: "ProductName", text: {} },
            { name: "SAPCode", text: {} },
            { name: "BatchNumber", text: {} }, // Lote
            { name: "Quantity", number: {} },
            { name: "JSON_Data", text: { allowMultipleLines: true, appendChangesToExistingText: false } }
        ]);

        // 2. Criar Lista de Histórico
        onProgress("Verificando lista de Histórico...");
        await this.ensureList(client, siteId, SHAREPOINT_CONFIG.lists.history, {
            description: "LabControl - Log de Movimentações",
            list: { template: "genericList" }
        }, [
            { name: "TransactionType", choice: { choices: ["ENTRADA", "SAIDA", "AJUSTE", "TRANSFERENCIA"] } },
            { name: "ItemLinkID", text: {} },
            { name: "Quantity", number: {} },
            { name: "JSON_Data", text: { allowMultipleLines: true, appendChangesToExistingText: false } }
        ]);

        onProgress("Backend SharePoint configurado com sucesso!");
    },

    async ensureList(client: Client, siteId: string, listName: string, listDef: any, columns: any[]) {
        try {
            // Tenta pegar a lista
            await client.api(`/sites/${siteId}/lists/${listName}`).get();
            console.log(`Lista ${listName} já existe.`);
        } catch (e: any) {
            if (e.statusCode === 404) {
                console.log(`Criando lista ${listName}...`);
                // Cria a lista
                const newList = await client.api(`/sites/${siteId}/lists`).post({
                    displayName: listName,
                    ...listDef
                });
                
                // Cria colunas
                for (const col of columns) {
                    await client.api(`/sites/${siteId}/lists/${newList.id}/columns`).post(col);
                }
            } else {
                throw e;
            }
        }
    },

    // --- SYNC OPERATIONS ---

    async fetchRemoteInventory(): Promise<InventoryItem[]> {
        const client = await this.getClient();
        
        // Paginação simples (ajustar se > 2000 itens)
        const result = await client.api(`/sites/${SHAREPOINT_CONFIG.siteId}/lists/${SHAREPOINT_CONFIG.lists.inventory}/items`)
            .expand('fields(select=Title,JSON_Data)')
            .top(999) 
            .get();

        const items: InventoryItem[] = [];
        
        if (result.value) {
            for (const row of result.value) {
                try {
                    if (row.fields.JSON_Data) {
                        const item = JSON.parse(row.fields.JSON_Data);
                        items.push(item);
                    }
                } catch (e) {
                    console.warn("Erro ao parsear item do SharePoint", row.id);
                }
            }
        }
        return items;
    },

    async addOrUpdateItem(item: InventoryItem): Promise<void> {
        if (!this.isAuthenticated()) return;

        const client = await this.getClient();
        
        // Busca se item existe pelo Title (que armazenamos o ID do sistema)
        const existing = await client.api(`/sites/${SHAREPOINT_CONFIG.siteId}/lists/${SHAREPOINT_CONFIG.lists.inventory}/items`)
            .filter(`fields/Title eq '${item.id}'`)
            .get();

        const payload = {
            fields: {
                Title: item.id,
                ProductName: item.name,
                SAPCode: item.sapCode,
                Quantity: item.quantity,
                BatchNumber: item.lotNumber,
                JSON_Data: JSON.stringify(item)
            }
        };

        if (existing.value && existing.value.length > 0) {
            const spId = existing.value[0].id;
            await client.api(`/sites/${SHAREPOINT_CONFIG.siteId}/lists/${SHAREPOINT_CONFIG.lists.inventory}/items/${spId}`)
                .update(payload);
        } else {
            await client.api(`/sites/${SHAREPOINT_CONFIG.siteId}/lists/${SHAREPOINT_CONFIG.lists.inventory}/items`)
                .post(payload);
        }
    },

    async deleteItem(itemId: string): Promise<void> {
        if (!this.isAuthenticated()) return;

        const client = await this.getClient();
        
        const existing = await client.api(`/sites/${SHAREPOINT_CONFIG.siteId}/lists/${SHAREPOINT_CONFIG.lists.inventory}/items`)
            .filter(`fields/Title eq '${itemId}'`)
            .get();

        if (existing.value && existing.value.length > 0) {
            const spId = existing.value[0].id;
            await client.api(`/sites/${SHAREPOINT_CONFIG.siteId}/lists/${SHAREPOINT_CONFIG.lists.inventory}/items/${spId}`)
                .delete();
        }
    },

    async logMovement(record: MovementRecord): Promise<void> {
        if (!this.isAuthenticated()) return;

        const client = await this.getClient();
        
        const payload = {
            fields: {
                Title: record.id,
                TransactionType: record.type,
                ItemLinkID: record.itemId,
                Quantity: record.quantity,
                JSON_Data: JSON.stringify(record)
            }
        };

        await client.api(`/sites/${SHAREPOINT_CONFIG.siteId}/lists/${SHAREPOINT_CONFIG.lists.history}/items`)
            .post(payload);
    }
};
