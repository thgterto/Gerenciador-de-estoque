
import { InventoryRepository } from '../domain/repositories/InventoryRepository';
import { CatalogProduct } from '../domain/entities/CatalogProduct';
import { InventoryBatch } from '../domain/entities/InventoryBatch';
import { StockBalance } from '../domain/entities/StockBalance';
import { StorageLocation } from '../domain/entities/StorageLocation';
import { StockMovement } from '../domain/entities/StockMovement';

export interface SyncDataDTO {
  catalog?: CatalogProduct[];
  batches?: InventoryBatch[];
  balances?: StockBalance[];
  locations?: StorageLocation[];
  movements?: StockMovement[];
}

export class SyncData {
  constructor(private inventoryRepository: InventoryRepository) {}

  async execute(data: SyncDataDTO) {
    await this.inventoryRepository.syncData(data);
  }
}
