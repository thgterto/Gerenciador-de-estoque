/* eslint-disable */
import { getSP } from '../spcontext';
import type { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/batching";

export interface IInventoryItem {
  id: string;
  sapCode: string;
  casNumber: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
  minStock: number;
  riskFlags: any;
  status: string;
}

class InventoryService {
  private sp: SPFI;

  constructor() {
    this.sp = getSP();
  }

  async getAllItems(): Promise<IInventoryItem[]> {
    if (!this.sp) return [];
    try {
      const items = await this.sp.web.lists.getByTitle("LabControl_Catalog").items.select("*")();
      return items as any;
    } catch (e) {
      return [];
    }
  }

  async addItem(item: Partial<IInventoryItem>): Promise<any> {
    if (!this.sp) return;
    return await this.sp.web.lists.getByTitle("LabControl_Catalog").items.add(item as any);
  }

  async processTransaction(transaction: any): Promise<void> {
    if (!this.sp) return;
    const [batchedSP, execute] = this.sp.batched();
    batchedSP.web.lists.getByTitle("LabControl_Balances").items.add({Title: "txn"} as any);
    batchedSP.web.lists.getByTitle("LabControl_History").items.add({Title: "txn"} as any);
    await execute();
  }

  async updateItem(id: string, item: any): Promise<any> { return null; }
  async deleteItem(id: string): Promise<any> { return null; }
  async deleteBulk(ids: string[]): Promise<any> { return null; }
  async getItemBatchDetails(id: string): Promise<any> { return { inStock: [], outOfStock: [], totalQuantity: 0 }; }
  async getDashboardMetrics(): Promise<any> { return { totalItems: 0, lowStockItems: 0, criticalItems: 0, activeBatches: 0, recentTransactions: [] }; }
  async getHistory(): Promise<any> { return []; }
  async initialize(): Promise<any> { return true; }
  async syncFromCloud(): Promise<any> { return true; }
  async findItemByCode(code: string): Promise<any> { return null; }
  async registerMovement(movement: any): Promise<any> { return true; }
  async exportData(): Promise<any> { return true; }
  async runLedgerAudit(): Promise<any> { return []; }
  async updateItemPosition(id: string, pos: any): Promise<any> { return true; }
}

export const inventoryService = new InventoryService();
export { InventoryService };
