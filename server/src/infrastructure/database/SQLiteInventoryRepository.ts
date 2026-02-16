
import { InventoryRepository } from '../../domain/repositories/InventoryRepository';
import { InventoryTransaction } from '../../domain/entities/InventoryTransaction';
import { Product } from '../../domain/entities/Product';
import { db } from './database';
import { sql } from 'kysely';

export class SQLiteInventoryRepository implements InventoryRepository {
  async saveProduct(product: Product): Promise<void> {
    await db.insertInto('products')
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
    const result = await db.selectFrom('products')
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
    const results = await db.selectFrom('products')
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
    await db.insertInto('inventory_transactions')
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
    const results = await db.selectFrom('inventory_transactions')
      .selectAll()
      .where('product_id', '=', productId)
      .orderBy('timestamp', 'desc')
      .execute();

    return results.map(row => new InventoryTransaction(
      row.product_id,
      row.type as any,
      row.qty,
      row.user,
      row.id,
      row.timestamp
    ));
  }

  async getAllTransactions(): Promise<InventoryTransaction[]> {
    const results = await db.selectFrom('inventory_transactions')
      .selectAll()
      .orderBy('timestamp', 'desc')
      .execute();

    return results.map(row => new InventoryTransaction(
      row.product_id,
      row.type as any,
      row.qty,
      row.user,
      row.id,
      row.timestamp
    ));
  }

  async calculateStock(productId: string): Promise<number> {
    const result = await db.selectFrom('inventory_transactions')
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
