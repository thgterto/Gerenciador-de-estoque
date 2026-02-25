
import { InventoryRepository } from '../../domain/repositories/InventoryRepository';
import { InventoryTransaction } from '../../domain/entities/InventoryTransaction';
import { Product } from '../../domain/entities/Product';
import { CatalogProduct } from '../../domain/entities/CatalogProduct';
import { InventoryBatch } from '../../domain/entities/InventoryBatch';
import { StockBalance } from '../../domain/entities/StockBalance';
import { StorageLocation } from '../../domain/entities/StorageLocation';
import { StockMovement } from '../../domain/entities/StockMovement';
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

  // --- V2 Implementation ---

  async getFullDatabase() {
    const catalog = await db.selectFrom('catalog').selectAll().execute();
    const batches = await db.selectFrom('batches').selectAll().execute();
    const locations = await db.selectFrom('storage_locations').selectAll().execute();
    const balances = await db.selectFrom('stock_balances').selectAll().execute();
    const movements = await db.selectFrom('stock_movements').selectAll().execute();

    return {
      catalog: catalog.map(c => ({
        ...c,
        isControlled: Boolean(c.is_controlled),
        isActive: Boolean(c.is_active),
        risks: c.risks ? JSON.parse(c.risks) : {},
        sapCode: c.sap_code,
        categoryId: c.category_id,
        baseUnit: c.base_unit,
        casNumber: c.cas_number,
        molecularFormula: c.molecular_formula,
        molecularWeight: c.molecular_weight,
        minStockLevel: c.min_stock_level,
        updatedAt: c.updated_at
      })),
      batches: batches.map(b => ({
        ...b,
        status: b.status as any,
        catalogId: b.catalog_id,
        lotNumber: b.lot_number,
        expiryDate: b.expiry_date,
        partnerId: b.partner_id,
        unitCost: b.unit_cost,
        updatedAt: b.updated_at
      })),
      locations: locations.map(l => ({
        ...l,
        isActive: Boolean(l.is_active),
        parentId: l.parent_id
      })),
      balances: balances.map(b => ({
        ...b,
        batchId: b.batch_id,
        locationId: b.location_id,
        lastMovementAt: b.last_movement_at
      })),
      movements: movements.map(m => ({
        ...m,
        batchId: m.batch_id,
        fromLocationId: m.from_location_id,
        toLocationId: m.to_location_id,
        userId: m.user_id,
        createdAt: m.created_at
      }))
    };
  }

  async syncData(data: {
    catalog?: CatalogProduct[];
    batches?: InventoryBatch[];
    balances?: StockBalance[];
    locations?: StorageLocation[];
    movements?: StockMovement[];
  }): Promise<void> {
    await db.transaction().execute(async (trx) => {
        // Upsert Catalog
        if (data.catalog && data.catalog.length > 0) {
            for (const item of data.catalog) {
                await trx.insertInto('catalog').values({
                    id: item.id,
                    sap_code: item.sapCode,
                    name: item.name,
                    category_id: item.categoryId,
                    base_unit: item.baseUnit,
                    cas_number: item.casNumber,
                    molecular_formula: item.molecularFormula,
                    molecular_weight: item.molecularWeight,
                    risks: JSON.stringify(item.risks),
                    is_controlled: item.isControlled ? 1 : 0,
                    min_stock_level: item.minStockLevel,
                    is_active: item.isActive ? 1 : 0,
                    updated_at: item.updatedAt || new Date().toISOString()
                }).onConflict(oc => oc.column('id').doUpdateSet({
                    sap_code: item.sapCode,
                    name: item.name,
                    category_id: item.categoryId,
                    base_unit: item.baseUnit,
                    cas_number: item.casNumber,
                    molecular_formula: item.molecularFormula,
                    molecular_weight: item.molecularWeight,
                    risks: JSON.stringify(item.risks),
                    is_controlled: item.isControlled ? 1 : 0,
                    min_stock_level: item.minStockLevel,
                    is_active: item.isActive ? 1 : 0,
                    updated_at: item.updatedAt || new Date().toISOString()
                })).execute();
            }
        }

        // Upsert Batches
        if (data.batches && data.batches.length > 0) {
             for (const item of data.batches) {
                await trx.insertInto('batches').values({
                    id: item.id,
                    catalog_id: item.catalogId,
                    lot_number: item.lotNumber,
                    expiry_date: item.expiryDate || null,
                    partner_id: item.partnerId || null,
                    status: item.status,
                    unit_cost: item.unitCost || 0,
                    updated_at: item.updatedAt || new Date().toISOString()
                }).onConflict(oc => oc.column('id').doUpdateSet({
                    catalog_id: item.catalogId,
                    lot_number: item.lotNumber,
                    expiry_date: item.expiryDate || null,
                    partner_id: item.partnerId || null,
                    status: item.status,
                    unit_cost: item.unitCost || 0,
                    updated_at: item.updatedAt || new Date().toISOString()
                })).execute();
            }
        }

        // Upsert Locations
        if (data.locations && data.locations.length > 0) {
            for (const item of data.locations) {
                await trx.insertInto('storage_locations').values({
                    id: item.id,
                    name: item.name,
                    type: item.type || null,
                    parent_id: item.parentId || null,
                    is_active: item.isActive ? 1 : 0
                }).onConflict(oc => oc.column('id').doUpdateSet({
                    name: item.name,
                    type: item.type || null,
                    parent_id: item.parentId || null,
                    is_active: item.isActive ? 1 : 0
                })).execute();
            }
        }

        // Upsert Balances
        if (data.balances && data.balances.length > 0) {
            for (const item of data.balances) {
                await trx.insertInto('stock_balances').values({
                    id: item.id,
                    batch_id: item.batchId,
                    location_id: item.locationId,
                    quantity: item.quantity,
                    last_movement_at: item.lastMovementAt
                }).onConflict(oc => oc.column('id').doUpdateSet({
                    quantity: item.quantity,
                    last_movement_at: item.lastMovementAt
                })).execute();
            }
        }

        // Upsert Movements (Usually strictly insert, but for sync we upsert)
        if (data.movements && data.movements.length > 0) {
             for (const item of data.movements) {
                await trx.insertInto('stock_movements').values({
                    id: item.id,
                    batch_id: item.batchId,
                    type: item.type,
                    quantity: item.quantity,
                    from_location_id: item.fromLocationId || null,
                    to_location_id: item.toLocationId || null,
                    date: item.date,
                    user_id: item.userId,
                    observation: item.observation,
                    created_at: item.createdAt
                }).onConflict(oc => oc.column('id').doNothing()).execute();
            }
        }
    });
  }
}
