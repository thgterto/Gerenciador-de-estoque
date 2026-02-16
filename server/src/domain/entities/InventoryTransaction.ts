
import { randomUUID } from 'crypto';

export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST'
}

export class InventoryTransaction {
  public readonly id: string;
  public readonly product_id: string;
  public readonly type: TransactionType;
  public readonly qty: number;
  public readonly timestamp: string;
  public readonly user: string;

  constructor(
    product_id: string,
    type: TransactionType,
    qty: number,
    user: string,
    id?: string,
    timestamp?: string
  ) {
    this.id = id || randomUUID();
    this.product_id = product_id;
    this.type = type;
    this.qty = qty;
    this.timestamp = timestamp || new Date().toISOString();
    this.user = user;

    // Immutability enforced by readonly properties
  }
}
