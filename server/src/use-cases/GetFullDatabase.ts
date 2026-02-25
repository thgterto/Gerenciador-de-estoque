
import { InventoryRepository } from '../domain/repositories/InventoryRepository';

export class GetFullDatabase {
  constructor(private inventoryRepository: InventoryRepository) {}

  async execute() {
    return await this.inventoryRepository.getFullDatabase();
  }
}
