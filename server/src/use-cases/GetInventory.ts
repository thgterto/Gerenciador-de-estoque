
import { InventoryRepository } from '../domain/repositories/InventoryRepository';
import { Product } from '../domain/entities/Product';

export interface InventoryItemDTO {
  product: Product;
  currentStock: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

export class GetInventory {
  constructor(private inventoryRepository: InventoryRepository) {}

  async execute(): Promise<InventoryItemDTO[]> {
    const products = await this.inventoryRepository.getAllProducts();
    const inventory: InventoryItemDTO[] = [];

    for (const product of products) {
      const currentStock = await this.inventoryRepository.calculateStock(product.id);
      const status = product.calculateStatus(currentStock);
      inventory.push({
        product,
        currentStock,
        status,
      });
    }

    return inventory;
  }
}
