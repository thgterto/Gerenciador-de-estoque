# Spec: Backend Data Model Upgrade to V2

## 1. Overview
This specification details the upgrade of the backend data model to support the V2 architecture used by the frontend. The goal is to persist and serve the full graph of inventory objects (`Catalog`, `Batch`, `Balance`, `Location`, `Movement`) to enable full offline/online synchronization.

## 2. Database Schema (SQLite)

We will introduce new tables to mirror the frontend's Dexie structure. The existing `products` table will be deprecated but kept for compatibility during migration, or mapped to `catalog`. We will focus on the new tables.

### Tables
```sql
-- 1. Catalog (Master Data)
CREATE TABLE IF NOT EXISTS catalog (
  id TEXT PRIMARY KEY,
  sap_code TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT,
  base_unit TEXT NOT NULL,
  cas_number TEXT,
  molecular_formula TEXT,
  molecular_weight REAL,
  risks TEXT, -- JSON string
  is_controlled INTEGER DEFAULT 0, -- Boolean
  min_stock_level REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  updated_at TEXT
);

-- 2. Batches (Lotes)
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  expiry_date TEXT,
  partner_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  unit_cost REAL,
  updated_at TEXT,
  FOREIGN KEY(catalog_id) REFERENCES catalog(id)
);

-- 3. Storage Locations
CREATE TABLE IF NOT EXISTS storage_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT, -- e.g., 'WAREHOUSE', 'SHELF'
  parent_id TEXT,
  is_active INTEGER DEFAULT 1
);

-- 4. Stock Balances (Saldos)
CREATE TABLE IF NOT EXISTS stock_balances (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  last_movement_at TEXT,
  FOREIGN KEY(batch_id) REFERENCES batches(id),
  FOREIGN KEY(location_id) REFERENCES storage_locations(id),
  UNIQUE(batch_id, location_id)
);

-- 5. Stock Movements (Detailed History)
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA')) NOT NULL,
  quantity REAL NOT NULL,
  from_location_id TEXT,
  to_location_id TEXT,
  date TEXT NOT NULL,
  user_id TEXT,
  observation TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(batch_id) REFERENCES batches(id)
);
```

## 3. Domain Entities

We will define TypeScript interfaces/classes in `server/src/domain/entities/` to represent these tables.

### `CatalogProduct.ts`
```typescript
export interface CatalogProduct {
  id: string;
  sapCode: string;
  name: string;
  categoryId: string;
  baseUnit: string;
  casNumber?: string;
  molecularFormula?: string;
  molecularWeight?: number;
  risks: Record<string, boolean>; // Parsed from JSON
  isControlled: boolean;
  minStockLevel: number;
  isActive: boolean;
  updatedAt?: string;
}
```

### `InventoryBatch.ts`
```typescript
export interface InventoryBatch {
  id: string;
  catalogId: string;
  lotNumber: string;
  expiryDate?: string;
  partnerId?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'QUARANTINE';
  unitCost?: number;
  updatedAt?: string;
}
```

### `StockBalance.ts`
```typescript
export interface StockBalance {
  id: string;
  batchId: string;
  locationId: string;
  quantity: number;
  lastMovementAt: string;
}
```

### `StorageLocation.ts`
```typescript
export interface StorageLocation {
  id: string;
  name: string;
  type?: string;
  parentId?: string;
  isActive: boolean;
}
```

### `StockMovement.ts`
```typescript
export interface StockMovement {
  id: string;
  batchId: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  date: string;
  userId: string;
  observation?: string;
  createdAt?: string;
}
```

## 4. Repository Interface (`InventoryRepository.ts`)

New methods will be added to the interface:

```typescript
export interface InventoryRepository {
  // ... existing methods (saveProduct, getProductById, etc. - mapped to legacy or new)

  // V2 Methods
  getFullDatabase(): Promise<{
    catalog: CatalogProduct[];
    batches: InventoryBatch[];
    balances: StockBalance[];
    locations: StorageLocation[];
    movements: StockMovement[];
  }>;

  saveCatalog(items: CatalogProduct[]): Promise<void>;
  saveBatches(items: InventoryBatch[]): Promise<void>;
  saveBalances(items: StockBalance[]): Promise<void>;
  saveLocations(items: StorageLocation[]): Promise<void>;
  saveMovements(items: StockMovement[]): Promise<void>;

  // Atomic sync (optional but recommended)
  syncData(data: {
    catalog?: CatalogProduct[];
    batches?: InventoryBatch[];
    balances?: StockBalance[];
    locations?: StorageLocation[];
    movements?: StockMovement[];
  }): Promise<void>;
}
```

## 5. Use Cases

### `GetFullDatabase.ts`
- **Purpose**: Retrieve the full inventory state for frontend initialization/sync.
- **Logic**: Call repository `getFullDatabase()` and return the structured object.

### `SyncData.ts` (replaces `SaveProduct`/`LogTransaction` for V2)
- **Purpose**: Handle incoming sync payload from frontend (`InventorySyncManager`).
- **Logic**:
    1. Receive payload `{ catalog, batches, balances, movements }`.
    2. Validate payload.
    3. Call repository `syncData` to persist changes.
    4. Return success.

## 6. API Contract

### GET `/api/inventory/full`
- **Response**:
```json
{
  "catalog": [...],
  "batches": [...],
  "balances": [...],
  "locations": [...],
  "movements": [...]
}
```

### POST `/api/inventory/sync`
- **Body**:
```json
{
  "catalog": [...],
  "batches": [...],
  "balances": [...],
  "movements": [...]
}
```
- **Response**: `{ "success": true, "syncedAt": "ISO_DATE" }`

## 7. Migration Strategy
1. **Schema Update**: Implement SQL create statements in `database.ts`.
2. **Entity Implementation**: Create classes.
3. **Repository Update**: Implement methods in `SQLiteInventoryRepository`.
4. **Controller Update**: Add endpoints.
5. **Legacy Support**: Map old `GET /api/inventory` to query new tables and return the flat `InventoryItem` view for backward compatibility if needed, OR deprecate it if frontend fully switches to `fetchFullDatabase`. Given `RestApiService.fetchFullDatabase` uses `GET /inventory`, we might need to update that endpoint to return the new structure OR create a new one and update frontend.
   - *Decision*: We will create `GET /api/inventory/full` and update the frontend `RestApiService.ts` to use it, OR just overload `GET /api/inventory` to return the new structure if no query params.
   - *Refined Decision*: Create new endpoint `GET /api/inventory/full` and we will assume the frontend `RestApiService` will be updated to call this, or we update the existing `GET /api/inventory` to return the full structure if the client accepts it. For now, let's keep `GET /api/inventory` as is (returning flat list) and add `GET /api/inventory/full` for the sync.
   - *Correction*: The user request is "Complete the backend". Modifying the frontend might be out of scope unless necessary. However, `RestApiService.fetchFullDatabase` calls `GET /inventory` and expects `catalog`, `batches` etc. in the response (see `InventoryService.ts` analysis). So we should update `GET /api/inventory` to return the FULL structure.

   **Revised `GET /api/inventory` Contract**:
   Returns:
   ```json
   {
       "view": [], // The flat list (legacy)
       "catalog": [],
       "batches": [],
       "balances": [],
       "movements": []
   }
   ```
   This ensures backward compatibility while providing the new data.
