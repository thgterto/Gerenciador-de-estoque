
import { InventoryTransaction } from '../entities/InventoryTransaction';
import { Product } from '../entities/Product';
import { CatalogProduct } from '../entities/CatalogProduct';
import { InventoryBatch } from '../entities/InventoryBatch';
import { StockBalance } from '../entities/StockBalance';
import { StorageLocation } from '../entities/StorageLocation';
import { StockMovement } from '../entities/StockMovement';

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

  // V2 Methods
  getFullDatabase(): Promise<{
    catalog: CatalogProduct[];
    batches: InventoryBatch[];
    balances: StockBalance[];
    locations: StorageLocation[];
    movements: StockMovement[];
  }>;

  syncData(data: {
    catalog?: CatalogProduct[];
    batches?: InventoryBatch[];
    balances?: StockBalance[];
    locations?: StorageLocation[];
    movements?: StockMovement[];
  }): Promise<void>;
}
