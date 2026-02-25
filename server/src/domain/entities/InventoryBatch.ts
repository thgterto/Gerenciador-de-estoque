
export interface InventoryBatch {
  id: string;
  catalogId: string;
  lotNumber: string;
  expiryDate?: string | null;
  partnerId?: string | null;
  status: 'ACTIVE' | 'BLOCKED' | 'QUARANTINE';
  unitCost?: number | null;
  updatedAt?: string | null;
}
