import { InventoryRepository } from '../../domain/repositories/InventoryRepository';
import { InventoryTransaction, TransactionType } from '../../domain/entities/InventoryTransaction';
import { Product } from '../../domain/entities/Product';
import { db } from './database';
import { sql } from 'kysely';

const TABLE_PRODUCTS = 'products';
const TABLE_TRANSACTIONS = 'inventory_transactions';

export class SQLiteInventoryRepository implements InventoryRepository {
  async saveProduct(product: Product): Promise<void> {
    await db.insertInto(TABLE_PRODUCTS)
      .values({
        id: product.id,
        sku: product.sku,
        name: product.name,
        min_stock: product.min_stock,
        safety_stock: product.safety_stock,
      })
      .onConflict((oc) => oc
        .column('id')
        .doUpdateSet({
          sku: product.sku,
          name: product.name,
          min_stock: product.min_stock,
          safety_stock: product.safety_stock,
        })
      )
      .execute();
  }

  async getProductById(id: string): Promise<Product | null> {
    const result = await db.selectFrom(TABLE_PRODUCTS)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) return null;

    return new Product(
      result.sku,
      result.name,
      result.min_stock,
      result.safety_stock,
      result.id
    );
  }

  async getAllProducts(): Promise<Product[]> {
    const results = await db.selectFrom(TABLE_PRODUCTS)
      .selectAll()
      .execute();

    return results.map(row => new Product(
      row.sku,
      row.name,
      row.min_stock,
      row.safety_stock,
      row.id
    ));
  }

  async logTransaction(transaction: InventoryTransaction): Promise<void> {
    await db.insertInto(TABLE_TRANSACTIONS)
      .values({
        id: transaction.id,
        product_id: transaction.product_id,
        type: transaction.type,
        qty: transaction.qty,
        timestamp: transaction.timestamp,
        user: transaction.user,
      })
      .execute();
  }

  async getTransactionsByProductId(productId: string): Promise<InventoryTransaction[]> {
    const results = await db.selectFrom(TABLE_TRANSACTIONS)
      .selectAll()
      .where('product_id', '=', productId)
      .orderBy('timestamp', 'desc')
      .execute();

    return results.map(row => new InventoryTransaction(
      row.product_id,
      row.type as TransactionType,
      row.qty,
      row.user,
      row.id,
      row.timestamp
    ));
  }

  async getAllTransactions(): Promise<InventoryTransaction[]> {
    const results = await db.selectFrom(TABLE_TRANSACTIONS)
      .selectAll()
      .orderBy('timestamp', 'desc')
      .execute();

    return results.map(row => new InventoryTransaction(
      row.product_id,
      row.type as TransactionType,
      row.qty,
      row.user,
      row.id,
      row.timestamp
    ));
  }

  async calculateStock(productId: string): Promise<number> {
    const result = await db.selectFrom(TABLE_TRANSACTIONS)
      .select(({ fn }) => [
        fn.sum<number>(
            sql`CASE
                WHEN type = 'IN' THEN qty
                WHEN type = 'OUT' THEN -qty
                WHEN type = 'ADJUST' THEN qty
                ELSE 0 END`
        ).as('total_stock')
      ])
      .where('product_id', '=', productId)
      .executeTakeFirst();

    return result?.total_stock || 0;
  }

  async executeInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return db.transaction().execute(async () => await work());
  }
}
