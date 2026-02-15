
import { InventoryRepository } from '../domain/repositories/InventoryRepository';
import { InventoryTransaction, TransactionType } from '../domain/entities/InventoryTransaction';
import { Product } from '../domain/entities/Product';
import { FileLogger } from '../infrastructure/logging/FileLogger';

export interface LogTransactionRequest {
  productId: string;
  type: TransactionType;
  qty: number;
  user: string;
}

export class LogTransaction {
  constructor(
    private inventoryRepository: InventoryRepository,
    private fileLogger: FileLogger
  ) {}

  async execute(request: LogTransactionRequest): Promise<void> {
    await this.inventoryRepository.executeInTransaction(async () => {
      const product = await this.inventoryRepository.getProductById(request.productId);
      if (!product) {
        throw new Error(`Product with ID ${request.productId} not found`);
      }

      if (request.type === TransactionType.OUT) {
        const currentStock = await this.inventoryRepository.calculateStock(request.productId);
        if (currentStock < request.qty) {
          throw new Error(`Insufficient stock for product ${product.name} (SKU: ${product.sku}). Current: ${currentStock}, Requested: ${request.qty}`);
        }
      }

      const transaction = new InventoryTransaction(
        request.productId,
        request.type,
        request.qty,
        request.user
      );

      await this.inventoryRepository.logTransaction(transaction);

      this.fileLogger.log(`TRANSACTION: ${request.user} performed ${request.type} of ${request.qty} on Product ${product.name} (${product.sku})`);
    });
  }
}
