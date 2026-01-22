# Database Schema Documentation

## Overview

The application utilizes **Dexie.js** as a wrapper around the browser's **IndexedDB**, implementing a **Hybrid Storage Architecture**. This architecture runs two parallel data models to balance performance and data integrity:

1.  **V1 Snapshot (Denormalized/Flat)**: Optimized for UI rendering, search, and instant feedback. Acts as an "L1 Cache".
2.  **V2 Ledger (Normalized/Relational)**: A 3NF (Third Normal Form) relational structure that serves as the "Source of Truth", ensuring data integrity, traceability, and LIMS-standard compliance.

The database is named `QStockCorpDB`.

---

## Schema Versions

The database has evolved through three migrations:

*   **Version 1**: Legacy flat tables (`items`, `history`, `locations`).
*   **Version 2**: Introduction of the Relational LIMS Core (`catalog`, `batches`, `balances`).
*   **Version 3**: Offline Sync capabilities (`syncQueue`).

---

## 1. Relational Core (V2 Ledger)
*These tables represent the normalized "Real" state of the inventory.*

### `catalog` (CatalogProduct)
Defines the "WHAT" - Master data for products/chemicals. Shared across multiple batches.

*   **Primary Key**: `id` (String: `CAT-{HASH}`)
*   **Indexes**: `sapCode`, `name`, `categoryId`, `casNumber`
*   **Fields**:
    *   `id`: string
    *   `sapCode`: string (Corporate Code)
    *   `name`: string
    *   `categoryId`: string
    *   `baseUnit`: string (UOM)
    *   `casNumber`: string (Chemical ID)
    *   `molecularFormula`: string
    *   `molecularWeight`: string
    *   `risks`: RiskFlags (Object)
    *   `isControlled`: boolean
    *   `minStockLevel`: number
    *   `isActive`: boolean
    *   `createdAt`, `updatedAt`: DateISOString

### `batches` (InventoryBatch)
Defines the "WHICH" - Specific physical lots of a product.

*   **Primary Key**: `id` (String: `BAT-{UUID}`)
*   **Indexes**: `catalogId`, `lotNumber`, `partnerId`, `status`, `expiryDate`
*   **Foreign Keys**: `catalogId` -> `catalog.id`
*   **Fields**:
    *   `id`: string
    *   `catalogId`: string
    *   `partnerId`: string (Manufacturer)
    *   `lotNumber`: string
    *   `expiryDate`: DateISOString
    *   `manufactureDate`: DateISOString
    *   `unitCost`: number
    *   `status`: 'ACTIVE' | 'QUARANTINE' | 'BLOCKED' | 'DEPLETED'
    *   `serialNumber`: string (for Equipment)

### `balances` (StockBalance)
Defines the "WHERE" & "HOW MUCH" - Connects a Batch to a specific Storage Location.

*   **Primary Key**: `id` (String: `BAL-{HASH}`)
*   **Indexes**: `[batchId+locationId]` (Compound Unique), `batchId`, `locationId`
*   **Foreign Keys**:
    *   `batchId` -> `batches.id`
    *   `locationId` -> `storage_locations.id`
*   **Fields**:
    *   `id`: string
    *   `batchId`: string
    *   `locationId`: string
    *   `quantity`: number
    *   `lastMovementAt`: DateISOString

### `storage_locations` (StorageLocationEntity)
Physical storage hierarchy definition.

*   **Primary Key**: `id` (String)
*   **Indexes**: `name`, `type`, `parentId`
*   **Fields**:
    *   `id`: string
    *   `name`: string
    *   `type`: 'WAREHOUSE' | 'ROOM' | 'CABINET' | 'SHELF'
    *   `pathString`: string (Full text path)

### `partners` (BusinessPartner)
Suppliers and Manufacturers.

*   **Primary Key**: `id` (String)
*   **Indexes**: `name`, `type`, `active`
*   **Fields**:
    *   `id`: string
    *   `name`: string
    *   `type`: 'SUPPLIER' | 'MANUFACTURER'
    *   `active`: boolean

---

## 2. UI Optimized (V1 Snapshot)
*These tables are flattened for high-performance React rendering.*

### `items` (InventoryItem)
The main table used by the Inventory Grid. It is a join of Catalog + Batch + Balance.

*   **Primary Key**: `id` (String: Maps to a specific Balance ID or Batch ID)
*   **Indexes**: `sapCode`, `lotNumber`, `name`, `category`, `supplier`, `expiryDate`, `itemStatus`, `location.warehouse`, `molecularFormula`, `batchId`, `catalogId`
*   **Fields**:
    *   `id`: string
    *   `name`, `sapCode`, `lotNumber`, `quantity`, `unit`: Basic info
    *   `location`: StorageAddress (Object: warehouse, shelf, etc.)
    *   `risks`, `casNumber`, `category`: Copied from Catalog
    *   `batchId`: string (Link to V2)
    *   `catalogId`: string (Link to V2)

### `history` (MovementRecord)
Immutable audit trail of all transactions.

*   **Primary Key**: `id` (UUID)
*   **Indexes**: `itemId`, `date`, `type`, `sapCode`, `lot`, `productName`, `batchId`, `fromLocationId`, `toLocationId`
*   **Fields**:
    *   `id`: string
    *   `itemId`: string
    *   `type`: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA'
    *   `quantity`, `date`, `userId`, `observation`
    *   `batchId`: string (Link to V2)
    *   `fromLocationId`, `toLocationId`: string (Link to V2)

---

## 3. Support & Offline
*Infrastructure tables.*

### `syncQueue` (SyncQueueItem)
Stores offline actions to be replayed when connection is restored.

*   **Primary Key**: `id` (Auto-increment)
*   **Indexes**: `timestamp`, `action`
*   **Fields**:
    *   `action`: string (e.g., 'sync_transaction', 'upsert_item')
    *   `payload`: JSON
    *   `retryCount`: number
    *   `error`: string

### `systemConfigs`
Key-value store for app settings.

*   **Primary Key**: `key`
*   **Indexes**: `category`

---

## Behavioral Model

### Dual Write Strategy
The `InventoryService` implements an **Atomic Dual Write** pattern. Every state changing operation (Create, Update, Delete, Move) is wrapped in a `db.transaction()` that updates both V1 and V2 tables simultaneously.

*   **Write Path**: Input -> Validation -> Transaction [ Update `items` (V1) + Update `balances`/`history` (V2) ] -> Commit.
*   **Read Path**:
    *   UI Lists read from `items` (V1) for speed.
    *   Detailed Reports/Audits read from `balances` joined with `batches` (V2) for precision.

### Consistency Guarantee
Because IndexedDB transactions are ACID within the same database scope, the V1 and V2 tables are guaranteed to be consistent locally. If the browser crashes during a write, both updates roll back.

### Cloud Synchronization
Sync is handled by `GoogleSheetsService` (Backend) and `SyncQueueService` (Middleware).
*   **Online**: Transactions are pushed to Google Sheets immediately after local commit.
*   **Offline**: Failed pushes are caught and stored in `syncQueue`. The queue allows automatic replay when connectivity returns.
