
import Dexie, { type Table } from 'dexie';
import { 
    InventoryItem, 
    MovementRecord, 
    LocationDTO, 
    SupplierDTO, 
    LocalPurchaseOrderDTO,
    SystemConfigDTO,
    SystemLogDTO,
    // V2 Entities
    CatalogProduct,
    InventoryBatch,
    StorageLocationEntity,
    BusinessPartner,
    StockBalance,
    StockMovement, // New Entity
    SyncQueueItem
} from './types';
import { HybridStorageManager } from './utils/HybridStorage';

/**
 * CAMADA DE PERSISTÊNCIA (IndexedDB via Dexie)
 * Versão Híbrida: Suporta V1 (Flat) e V2 (Relational/LIMS)
 */
export class QStockDB extends Dexie {
  // --- V1 Legacy Tables (UI Compatibility) ---
  items!: Table<InventoryItem, string>;
  history!: Table<MovementRecord, string>;
  
  // --- V2 Normalized Tables (LIMS Architecture) ---
  catalog!: Table<CatalogProduct, string>;
  batches!: Table<InventoryBatch, string>;
  storage_locations!: Table<StorageLocationEntity, string>; // Standardized name
  partners!: Table<BusinessPartner, string>;
  balances!: Table<StockBalance, string>; // The "Cache" for distributed stock
  stock_movements!: Table<StockMovement, string>; // The Real Ledger

  // --- Support Tables ---
  syncQueue!: Table<SyncQueueItem, number>; // Offline Sync Queue
  locations!: Table<LocationDTO, number>; // Legacy Imports Container
  suppliers!: Table<SupplierDTO, number>; // Legacy Imports Container
  sapOrders!: Table<any, number>;
  sapOrderItems!: Table<any, number>;
  localOrders!: Table<LocalPurchaseOrderDTO, string>;
  systemConfigs!: Table<SystemConfigDTO, string>;
  systemLogs!: Table<SystemLogDTO, number>;

  constructor() {
    super('QStockCorpDB');
    
    // Schema Version 1 (Original)
    (this as any).version(1).stores({
      items: 'id, sapCode, lotNumber, name, category, supplier, expiryDate, itemStatus, location.warehouse, molecularFormula',
      history: 'id, itemId, date, type, sapCode, lot, productName',
      sapOrders: 'id, sapOrderId, status',
      sapOrderItems: 'id, sapOrderId, productBatchId',
      locations: 'id, storageLocation, fullLocationCode',
      suppliers: 'id, name',
      localOrders: 'id, status, orderNumber, createdAt',
      systemConfigs: 'key, category',
      systemLogs: '++id, timestamp, level, module'
    });

    // Schema Version 2 (LIMS V2 Upgrade)
    (this as any).version(2).stores({
        // V2 Tables - STRICTLY INDEXED
        catalog: 'id, sapCode, name, categoryId, casNumber',
        batches: 'id, catalogId, lotNumber, partnerId, status, expiryDate',
        storage_locations: 'id, name, type, parentId',
        partners: 'id, name, type, active',
        balances: 'id, [batchId+locationId], batchId, locationId', 
        
        // Retain V1 Schema
        items: 'id, sapCode, lotNumber, name, category, supplier, expiryDate, itemStatus, location.warehouse, molecularFormula, batchId, catalogId',
        history: 'id, itemId, date, type, sapCode, lot, productName, batchId, fromLocationId, toLocationId', 
        sapOrders: 'id, sapOrderId, status',
        sapOrderItems: 'id, sapOrderId, productBatchId',
        locations: 'id, storageLocation, fullLocationCode',
        suppliers: 'id, name',
        localOrders: 'id, status, orderNumber, createdAt',
        systemConfigs: 'key, category',
        systemLogs: '++id, timestamp, level, module'
    });

    // Schema Version 3 (Offline Capabilities)
    (this as any).version(3).stores({
        syncQueue: '++id, timestamp, action',
    });

    // Schema Version 4 (Ledger Architecture)
    (this as any).version(4).stores({
        stock_movements: 'id, batchId, type, [batchId+createdAt], [type+createdAt], fromLocationId, toLocationId',
        balances: 'id, [batchId+locationId], batchId, locationId' // Re-affirming balances with correct indices
    });

    // Schema Version 5 (Migration Fix Trigger)
    (this as any).version(5).stores({});

    // Schema Version 6 (Performance Optimization - Composite Indices)
    (this as any).version(6).stores({
        items: 'id, sapCode, lotNumber, name, category, supplier, expiryDate, itemStatus, location.warehouse, molecularFormula, batchId, catalogId, [category+itemStatus], [location.warehouse+category], [expiryDate+itemStatus]'
    });
  }
}

// Initialize Dexie
const rawDb = new QStockDB();

// --- Integrity Hooks (Soft Foreign Keys) ---

// 1. Prevent Catalog Deletion if Batches Exist
rawDb.catalog.hook('deleting', function (primKey, _obj, transaction) {
    // Checks if any batch is linked to this catalog product
    // @ts-expect-error - transaction.table is not strictly typed in this hook context but is valid Dexie API
    return transaction.table('batches').where('catalogId').equals(primKey).count().then(count => {
        if (count > 0) {
            throw new Error(`Integrity Error: Cannot delete Catalog Product because ${count} batches depend on it.`);
        }
    });
});

// 2. Cascade Delete Balances when Batch is Deleted
rawDb.batches.hook('deleting', function (primKey, _obj, transaction) {
    // Automatically delete orphaned balances to maintain clean state
    // @ts-expect-error - transaction.table is not strictly typed in this hook context but is valid Dexie API
    transaction.table('balances').where('batchId').equals(primKey).delete();
});

// Export Hybrid Manager (L1 Cache + L3 Persistence)
export const db = new HybridStorageManager(rawDb);
