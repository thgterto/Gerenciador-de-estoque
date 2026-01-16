
// ============================================================================
// 1. PRIMITIVES & SHARED TYPES
// ============================================================================

declare global {
  const echarts: any;
}

export type UUID = string;
export type DateISOString = string; // YYYY-MM-DDTHH:mm:ss.sssZ

export interface Auditable {
  createdAt?: DateISOString;
  updatedAt?: DateISOString;
  createdBy?: string;
  updatedBy?: string;
}

export interface RiskFlags {
  O: boolean;      // Oxidante
  T: boolean;      // Tóxico
  T_PLUS: boolean; // Muito Tóxico
  C: boolean;      // Corrosivo
  E: boolean;      // Explosivo
  N: boolean;      // Perigoso para o Meio Ambiente
  Xn: boolean;     // Nocivo
  Xi: boolean;     // Irritante
  F: boolean;      // Inflamável
  F_PLUS: boolean; // Extremamente Inflamável
}

export type ItemType = 'REAGENT' | 'GLASSWARE' | 'EQUIPMENT' | 'CONSUMABLE' | 'SPARE_PART';

// ============================================================================
// 2. DOMAIN V2: LEDGER (NORMALIZED SOURCE OF TRUTH - 3NF)
// ============================================================================

/**
 * Tabela: CATALOG
 * Chave Primária: id (CAT-...)
 * Dependência Funcional: Todos os atributos dependem apenas do ID do produto.
 */
export interface CatalogProduct extends Auditable {
  id: string;      
  sapCode: string; 
  name: string;
  categoryId: string;
  baseUnit: string;
  casNumber?: string;
  molecularFormula?: string;
  molecularWeight?: string;
  risks: RiskFlags;
  isControlled: boolean;
  minStockLevel: number; 
  isActive: boolean;
  
  // Dynamic Fields
  itemType?: ItemType;
  serialNumber?: string;
  calibrationDate?: DateISOString;
  maintenanceDate?: DateISOString;
  glassVolume?: string; // e.g. "500ml"
  glassMaterial?: string; // e.g. "Borossilicato"
  application?: string; // e.g. "Para HPLC Agilent 1200"
}

/**
 * Tabela: BATCHES
 * Chave Primária: id (BAT-...)
 * Chave Estrangeira: catalogId -> CatalogProduct
 * 3NF: Validade e Lote dependem da instância física (Batch), não do produto abstrato.
 */
export interface InventoryBatch extends Auditable {
  id: string;         
  catalogId: string;  
  partnerId?: string; // FK -> Partners (Fabricante)
  lotNumber: string;
  expiryDate?: DateISOString;
  manufactureDate?: DateISOString;
  unitCost: number;
  currency?: string;
  status: 'ACTIVE' | 'QUARANTINE' | 'BLOCKED' | 'DEPLETED' | 'OBSOLETE';
}

/**
 * Tabela: BALANCES
 * Chave Primária: id
 * Chave Composta Lógica: batchId + locationId
 * 3NF: A quantidade é um atributo da relação entre um lote e um local.
 */
export interface StockBalance extends Auditable {
  id: string;         
  batchId: string;    // FK -> InventoryBatch
  locationId: string; // FK -> StorageLocationEntity
  quantity: number;
  lastMovementAt: DateISOString;
}

/**
 * Tabela: STORAGE_LOCATIONS
 * Chave Primária: id
 */
export interface StorageLocationEntity extends Auditable {
  id: string;   
  name: string;
  type: 'WAREHOUSE' | 'ROOM' | 'CABINET' | 'SHELF' | 'BOX' | 'VIRTUAL';
  pathString: string; 
}

/**
 * Tabela: PARTNERS
 * Chave Primária: id
 */
export interface BusinessPartner extends Auditable {
  id: string; 
  name: string;
  type: 'SUPPLIER' | 'MANUFACTURER' | 'INTERNAL';
  active: boolean;
}

// ============================================================================
// 3. DOMAIN V1: SNAPSHOT (UI OPTIMIZED VIEW - DENORMALIZED)
// Utilizado apenas para leitura/exibição no Frontend (Presentation Layer)
// ============================================================================

export interface StorageAddress {
  warehouse: string;
  cabinet: string;
  shelf: string;
  position: string;
}

export interface InventoryItem extends Auditable {
  readonly id: string; // Geralmente mapeia para um BatchID principal ou agrupado
  
  // Virtual Foreign Keys
  catalogId?: string;
  batchId?: string;
  locationId?: string;

  // Catalog Data Snapshot
  sapCode: string;           
  name: string;
  itemType?: ItemType; // New Discriminator
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

  // Batch Data Snapshot
  lotNumber: string;         
  quantity: number; 
  expiryDate: DateISOString; 
  dateAcquired: DateISOString; 
  unitCost: number;          
  currency: string;          
  itemStatus: 'Ativo' | 'Bloqueado' | 'Quarentena' | 'Obsoleto';
  supplier: string;

  // Location Snapshot
  location: StorageAddress;
  
  lastUpdated: DateISOString; 
  isGhost?: boolean; 
}

/**
 * Tabela: MOVEMENTS (History)
 * Registro imutável de transações.
 */
export interface MovementRecord {
  readonly id: UUID;
  readonly itemId: string; // Link legado V1
  
  // V2 Ledger Links
  readonly batchId?: string;
  readonly fromLocationId?: string;
  readonly toLocationId?: string;
  
  readonly date: DateISOString; 
  readonly type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  
  // Snapshot Data (Histórico deve ser imutável, então guarda cópia dos dados no momento)
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
// 4. OPERATIONAL DTOs
// ============================================================================

export interface CreateItemDTO {
    // Identity (Catalog)
    name: string;
    sapCode?: string;
    category: string;
    baseUnit: string;
    minStockLevel: number;
    itemType: ItemType;
    isControlled?: boolean;

    // Chemical / Specifics
    casNumber?: string;
    molecularFormula?: string;
    molecularWeight?: string;
    risks?: RiskFlags;
    
    // Equipment Specifics
    serialNumber?: string;
    calibrationDate?: string;
    maintenanceDate?: string;

    // Glassware Specifics
    glassVolume?: string;
    glassMaterial?: string;

    // Spare Part Specifics
    application?: string;

    // Batch (Logística)
    lotNumber: string;
    expiryDate?: string;
    supplier?: string;
    unitCost?: number;

    // Balance (Inicial)
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
  i: string;
  n: string;
  s: string;
  l: string;
  e?: string;
  u?: string;
}

// Legado/Export Types
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
