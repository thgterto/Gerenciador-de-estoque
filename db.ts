
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

    // Schema Version 6 (Performance Improvements & Compound Indexes)
    (this as any).version(6).stores({
        // V1 Performance Indexes
        items: 'id, sapCode, lotNumber, name, category, supplier, expiryDate, itemStatus, location.warehouse, molecularFormula, batchId, catalogId, [category+itemStatus], [location.warehouse+category], [expiryDate+itemStatus]',

        // V2 Performance Indexes
        batches: 'id, catalogId, lotNumber, partnerId, status, expiryDate, [status+expiryDate], [catalogId+status]',
        catalog: 'id, sapCode, name, categoryId, casNumber, [categoryId+isActive]',

        // Support for Robust Sync (Versioning)
        // Note: version/updatedAt fields should be added to models if not present, but schema handles indexing
        syncQueue: '++id, timestamp, action, [timestamp+action]'
    });

    // --- Data Integrity Hooks (Soft FKs) ---
    this.catalog.hook('deleting', async (primKey, obj, transaction) => {
        // Prevent deletion of Catalog Product if Batches exist
        const batchCount = await this.batches.where('catalogId').equals(primKey).count();
        if (batchCount > 0) {
            throw new Error(`Integrity Constraint: Cannot delete Catalog Product used in ${batchCount} batches.`);
        }
    });

    this.batches.hook('deleting', async (primKey, obj, transaction) => {
        // Cascade Delete: Batch -> Balances (Logical)
        // Warning: This physically deletes records. Ensure this is desired behavior.
        // In a real audit system, we might want to block instead or soft-delete.
        // For now, we clean up orphans to prevent data inconsistency.

        // Note: Dexie transactions are not automatically inherited in async hooks properly without 'dexie-observable' or specific patterns.
        // However, for basic integrity checks (blocking), the above is fine.
        // For cascading, it's safer to rely on the service layer or explicit transactions.

        // Checking for balances to block deletion if stock exists
        const balanceCount = await this.balances.where('batchId').equals(primKey).count();
        if (balanceCount > 0) {
             // Optional: Allow deletion only if quantity is 0?
             // For strict integrity:
             // throw new Error("Cannot delete batch with active balance records.");
        }
    });
  }
}

// Initialize Dexie
const rawDb = new QStockDB();

// Export Hybrid Manager (L1 Cache + L3 Persistence)
export const db = new HybridStorageManager(rawDb);
