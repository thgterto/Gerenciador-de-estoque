
import { randomUUID } from 'crypto';

export class Product {
  public readonly id: string;
  public sku: string;
  public name: string;
  public min_stock: number;
  public safety_stock: number;

  constructor(
    sku: string,
    name: string,
    min_stock: number,
    safety_stock: number,
    id?: string
  ) {
    this.id = id || randomUUID();
    this.sku = sku;
    this.name = name;
    this.min_stock = min_stock;
    this.safety_stock = safety_stock;
  }

  public calculateStatus(currentStock: number): 'OK' | 'WARNING' | 'CRITICAL' {
    if (currentStock <= this.safety_stock) {
      return 'CRITICAL';
    }
    if (currentStock <= this.min_stock) {
      return 'WARNING';
    }
    return 'OK';
  }

  public validateSKU(): boolean {
    // Basic validation, can be enhanced with regex
    return this.sku.length > 0;
  }
}
