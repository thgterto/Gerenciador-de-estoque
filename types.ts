
// ============================================================================
// 1. PRIMITIVES & SHARED TYPES
// ============================================================================

declare global {
  const echarts: any;
}

export type UUID = string;
export type DateISOString = string; // Format: YYYY-MM-DDTHH:mm:ss.sssZ

/**
 * Base interface for database entities tracking creation and updates.
 */
export interface Auditable {
  createdAt?: DateISOString;
  updatedAt?: DateISOString;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * GHS (Globally Harmonized System) Risk Flags.
 * Used for chemical safety classification.
 */
export interface RiskFlags {
  O: boolean;      // Oxidante / Oxidizing
  T: boolean;      // Tóxico / Toxic
  T_PLUS: boolean; // Muito Tóxico / Very Toxic
  C: boolean;      // Corrosivo / Corrosive
  E: boolean;      // Explosivo / Explosive
  N: boolean;      // Perigoso para o Meio Ambiente / Environmental Hazard
  Xn: boolean;     // Nocivo / Harmful
  Xi: boolean;     // Irritante / Irritant
  F: boolean;      // Inflamável / Flammable
  F_PLUS: boolean; // Extremamente Inflamável / Extremely Flammable
}

export type ItemType = 'REAGENT' | 'GLASSWARE' | 'EQUIPMENT' | 'CONSUMABLE' | 'SPARE_PART';

// ============================================================================
// 2. DOMAIN V2: LEDGER (NORMALIZED SOURCE OF TRUTH - 3NF)
// The "Real" Database structure hidden behind the scenes.
// ============================================================================

/**
 * Defines "WHAT" the item is (Master Data).
 * Shared across multiple batches.
 */
export interface CatalogProduct extends Auditable {
  id: string;        // ID: CAT-{HASH}
  sapCode: string;   // Corporate Code
  name: string;      // Product Name
  categoryId: string;// Category Group
  baseUnit: string;  // UOM (Unit of Measure)
  
  // Chemical Properties
  casNumber?: string;
  molecularFormula?: string;
  molecularWeight?: string;
  risks: RiskFlags;
  isControlled: boolean;
  minStockLevel: number; 
  isActive: boolean;
  
  // Specific Attributes
  itemType?: ItemType;
  glassVolume?: string; 
  glassMaterial?: string; 
  application?: string; 
}

/**
 * Defines "WHICH" specific instance we have (Physical Lot).
 */
export interface InventoryBatch extends Auditable {
  id: string;         // ID: BAT-{UUID}
  catalogId: string;  // FK -> CatalogProduct
  partnerId?: string; // FK -> BusinessPartner (Manufacturer/Supplier)
  
  lotNumber: string;
  expiryDate?: DateISOString;
  manufactureDate?: DateISOString;
  
  unitCost: number;
  currency?: string;
  
  // Instance Specifics (Equipment)
  serialNumber?: string;
  calibrationDate?: DateISOString;
  maintenanceDate?: DateISOString;

  status: 'ACTIVE' | 'QUARANTINE' | 'BLOCKED' | 'DEPLETED' | 'OBSOLETE';
}

/**
 * Defines "WHERE" and "HOW MUCH" (Stock Quantities).
 * Connects a Batch to a Physical Location.
 */
export interface StockBalance extends Auditable {
  id: string;         // ID: BAL-{HASH}
  batchId: string;    // FK -> InventoryBatch
  locationId: string; // FK -> StorageLocationEntity
  quantity: number;
  lastMovementAt: DateISOString;
}

/**
 * Physical storage definitions.
 */
export interface StorageLocationEntity extends Auditable {
  id: string;   
  name: string;
  type: 'WAREHOUSE' | 'ROOM' | 'CABINET' | 'SHELF' | 'BOX' | 'VIRTUAL';
  pathString: string; // "Warehouse A > Cabinet 1 > Shelf 2"
}

export interface BusinessPartner extends Auditable {
  id: string; 
  name: string;
  type: 'SUPPLIER' | 'MANUFACTURER' | 'INTERNAL';
  active: boolean;
}

// ============================================================================
// 3. DOMAIN V1: SNAPSHOT (UI OPTIMIZED VIEW - DENORMALIZED)
// This is the "Flat" object used by the React UI for performance (L1 Cache).
// ============================================================================

export interface StorageAddress {
  warehouse: string;
  cabinet: string;
  shelf: string;
  position: string;
}

/**
 * The main UI entity.
 * It's a join of Catalog + Batch + Balance.
 */
export interface InventoryItem extends Auditable {
  readonly id: string; // Maps to a Balance ID or Main Batch ID
  
  // Foreign Keys (Hidden Link to V2)
  catalogId?: string;
  batchId?: string;
  locationId?: string;

  // --- From Catalog ---
  sapCode: string;           
  name: string;
  itemType?: ItemType;
  casNumber?: string;        
  molecularFormula?: string; 
  molecularWeight?: string;  
  category: string; 
  type: 'ROH' | 'HALB' | 'FERT';
  materialGroup: string;
  isControlled: boolean;     
  baseUnit: string;          
  minStockLevel: number;
  risks: RiskFlags;

  // Equipment Specifics
  serialNumber?: string;
  calibrationDate?: DateISOString;
  maintenanceDate?: DateISOString;

  // Glassware Specifics
  glassVolume?: string;
  glassMaterial?: string;

  // Spare Parts Specifics
  application?: string;

  // --- From Batch ---
  lotNumber: string;         
  expiryDate: DateISOString; 
  dateAcquired: DateISOString; 
  unitCost: number;          
  currency: string;          
  itemStatus: 'Ativo' | 'Bloqueado' | 'Quarentena' | 'Obsoleto';
  supplier: string;

  // --- From Balance ---
  quantity: number; 
  location: StorageAddress;
  lastUpdated: DateISOString; 
  
  // Metadata
  isGhost?: boolean; // If true, exists in history but not in current stock
}

/**
 * Immutable Ledger Entry (Audit Trail).
 */
export interface MovementRecord {
  readonly id: UUID;
  readonly itemId: string; // Link to the Item Snapshot ID
  
  // V2 Links
  readonly batchId?: string;
  readonly fromLocationId?: string;
  readonly toLocationId?: string;
  
  readonly date: DateISOString; 
  readonly type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  
  // Snapshot Data (Redundant but necessary for immutable history)
  readonly productName: string;
  readonly sapCode: string;
  readonly lot: string;
  readonly quantity: number;
  readonly unit: string;
  
  readonly location_warehouse?: string; 
  readonly userId?: string; 
  readonly observation?: string; 
  readonly supplier?: string;
}

// ============================================================================
// 4. OPERATIONAL DTOs & SERVICE TYPES
// ============================================================================

export interface CreateItemDTO {
    name: string;
    sapCode?: string;
    category: string;
    baseUnit: string;
    minStockLevel: number;
    itemType: ItemType;
    isControlled?: boolean;

    casNumber?: string;
    molecularFormula?: string;
    molecularWeight?: string;
    risks?: RiskFlags;
    
    serialNumber?: string;
    calibrationDate?: string;
    maintenanceDate?: string;

    glassVolume?: string;
    glassMaterial?: string;

    application?: string;

    lotNumber: string;
    expiryDate?: string;
    supplier?: string;
    unitCost?: number;

    quantity: number;
    location: StorageAddress;
}

export interface StockTransactionDTO {
  itemId: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  quantity: number; 
  date: DateISOString; 
  observation?: string;
  userId?: string;
  fromLocationId?: string;
  toLocationId?: string;
}

export interface PurchaseRequestItem {
  id: string; 
  itemId: string; 
  name: string;
  sapCode: string;
  currentStock: number;
  requestedQty: number;
  unit: string;
  reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ORDERED';
}

export interface LocalPurchaseOrderDTO extends Auditable {
  id: string;
  orderNumber: string; 
  status: 'DRAFT' | 'SUBMITTED';
  items: PurchaseRequestItem[]; 
}

export interface CasDataDTO {
    rn: string;
    name: string;
    molecularFormula?: string;
    molecularMass?: string;
    pubChemImage?: string;
}

export interface QRCodeDataDTO {
  i: string; // ID
  n: string; // Name
  s: string; // SAP
  l: string; // Lot
  e?: string;// Expiry
  u?: string;// Unit
}

// Service & View Types
export interface BatchDetailView {
    batchId: string;
    lotNumber: string;
    expiryDate: string;
    quantity: number;
    locationName: string;
    status: string;
}

export interface ImportResult {
    total: number;
    created: number;
    updated: number;
    ignored: number;
}

// Offline Sync Types
export interface SyncQueueItem {
    id?: number;
    timestamp: number;
    action: string;
    payload: any;
    retryCount: number;
    error?: string;
}

// Legacy/Export Types (Keep for compatibility)
export interface LocationDTO { id: number; storageLocation: string; cabinet: string; floor: string; position: string; fullLocationCode: string; }
export interface SupplierDTO { id: number; name: string; }
export interface ProductBatchDTO { id: number; productName: string; sapCode: string; batch: string; expirationDate: string | null; supplierId: number; locationId: number; unitOfMeasure: string; costPerUnit?: number; [key: string]: any; }
export interface LegacyLimsData { produtos: any[]; lotes: any[]; movimentacoes: any[]; }
export interface FullRelationalDumpDTO { metadata: any; relationalData?: { locations: LocationDTO[]; suppliers: SupplierDTO[]; productBatches: ProductBatchDTO[]; movementHistory: any[]; }; dados?: LegacyLimsData; dml?: any; }
export interface ExportOptions { includeHistory: boolean; format: 'xlsx' | 'csv'; }

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';
export interface User { readonly id: string; readonly name: string; readonly username: string; readonly role: UserRole; readonly avatar?: string; readonly active: boolean; }
export interface SystemConfigDTO { key: string; value: any; category: string; }
export interface SystemLogDTO { id?: number; timestamp: DateISOString; action: string; module: string; details: string; level: 'INFO' | 'WARN' | 'ERROR'; }
export type AlertSeverity = 'success' | 'error' | 'warning' | 'info';
export interface AppNotification { id: string; type: AlertSeverity; title: string; message?: string; duration?: number; }
