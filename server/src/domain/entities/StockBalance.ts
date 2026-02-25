
export interface StockBalance {
  id: string;
  batchId: string;
  locationId: string;
  quantity: number;
  lastMovementAt: string | null;
}
