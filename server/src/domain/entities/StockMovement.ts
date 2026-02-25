
export interface StockMovement {
  id: string;
  batchId: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  quantity: number;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  date: string;
  userId: string | null;
  observation?: string | null;
  createdAt?: string | null;
}
