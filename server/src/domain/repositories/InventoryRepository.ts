
import { InventoryTransaction } from '../entities/InventoryTransaction';
import { Product } from '../entities/Product';

export interface InventoryRepository {
  // Product Operations
  saveProduct(product: Product): Promise<void>;
  getProductById(id: string): Promise<Product | null>;
  getAllProducts(): Promise<Product[]>;

  // Transaction Operations
  logTransaction(transaction: InventoryTransaction): Promise<void>;
  getTransactionsByProductId(productId: string): Promise<InventoryTransaction[]>;
  getAllTransactions(): Promise<InventoryTransaction[]>;

  // Aggregations
  calculateStock(productId: string): Promise<number>;

  // Transaction Management
  executeInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
