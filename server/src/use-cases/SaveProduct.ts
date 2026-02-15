
import { InventoryRepository } from '../domain/repositories/InventoryRepository';
import { Product } from '../domain/entities/Product';

export interface SaveProductRequest {
  id?: string;
  sku: string;
  name: string;
  min_stock: number;
  safety_stock: number;
}

export class SaveProduct {
  constructor(private inventoryRepository: InventoryRepository) {}

  async execute(request: SaveProductRequest): Promise<void> {
    const product = new Product(
      request.sku,
      request.name,
      request.min_stock,
      request.safety_stock,
      request.id
    );

    // Validate SKU
    if (!product.validateSKU()) {
      throw new Error(`Invalid SKU: ${product.sku}`);
    }

    await this.inventoryRepository.saveProduct(product);
  }
}
