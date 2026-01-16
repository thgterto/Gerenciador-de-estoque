
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
    StockBalance
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
  storage_locations!: Table<StorageLocationEntity, string>;
  partners!: Table<BusinessPartner, string>;
  balances!: Table<StockBalance, string>; // The "Cache" for distributed stock

  // --- Support Tables ---
  locations!: Table<LocationDTO, number>; // Legacy Imports
  suppliers!: Table<SupplierDTO, number>; // Legacy Imports
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
    // Adiciona tabelas normalizadas e índices de performance
    (this as any).version(2).stores({
        // V2 Tables
        catalog: 'id, sapCode, name, categoryId',
        batches: 'id, catalogId, lotNumber, partnerId, status, expiryDate',
        storage_locations: 'id, name, type, parentId',
        partners: 'id, name, type, active',
        balances: 'id, [batchId+locationId], batchId, locationId', // Compound index for fast lookup
        
        // Retain V1
        items: 'id, sapCode, lotNumber, name, category, supplier, expiryDate, itemStatus, location.warehouse, molecularFormula',
        history: 'id, itemId, date, type, sapCode, lot, productName, batchId, fromLocationId, toLocationId', // Enhanced index
        sapOrders: 'id, sapOrderId, status',
        sapOrderItems: 'id, sapOrderId, productBatchId',
        locations: 'id, storageLocation, fullLocationCode',
        suppliers: 'id, name',
        localOrders: 'id, status, orderNumber, createdAt',
        systemConfigs: 'key, category',
        systemLogs: '++id, timestamp, level, module'
    });
  }
}

// Initialize Dexie
const rawDb = new QStockDB();

// Export Hybrid Manager (L1 Cache + L3 Persistence)
export const db = new HybridStorageManager(rawDb);
