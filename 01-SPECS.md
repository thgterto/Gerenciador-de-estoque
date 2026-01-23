# 01-SPECS.md (Blueprint)

## 1. System Overview
**Name:** LabControl LIMS (Replication Spec)
**Type:** Offline-First Desktop/Web Application
**Core Function:** Inventory Management with Batch Tracking, GHS Safety Compliance, and Cloud Synchronization.

## 2. Data Model

### A. Local Storage (IndexedDB / Dexie)

The database `QStockCorpDB` uses a **Hybrid Schema**:

#### V1: Snapshot (UI Optimized)
*   **Table:** `items`
*   **Purpose:** Fast rendering of the "Current State".
*   **Key Fields:**
    *   `id` (PK, String): Unique Inventory ID.
    *   `name` (Index): Product Name.
    *   `quantity`: Current consolidated quantity.
    *   `batchId`: Link to V2 Batch.
    *   `catalogId`: Link to V2 Catalog.
    *   `sapCode`, `lotNumber`, `expiryDate`: Denormalized fields.

#### V2: Ledger (Source of Truth)
*   **Table:** `catalog`
    *   `id` (PK): `CAT-{Hash}`.
    *   `name`, `sapCode`, `casNumber`, `risks`: Static Product Data.
*   **Table:** `batches`
    *   `id` (PK): `BAT-{Hash}`.
    *   `catalogId`: FK to Catalog.
    *   `lotNumber`: Specific Lot/Lote.
    *   `expiryDate`: Validity.
*   **Table:** `balances`
    *   `id` (PK): `BAL-{Hash}`.
    *   `batchId`: FK to Batch.
    *   `locationId`: Storage Location ID.
    *   `quantity`: Quantity in this specific location.
*   **Table:** `stock_movements` (Immutable Log)
    *   `id` (PK): UUID.
    *   `type`: `ENTRADA` | `SAIDA` | `AJUSTE` | `TRANSFERENCIA`.
    *   `quantity`: Delta.
    *   `fromLocationId`, `toLocationId`.
    *   `createdAt`: Timestamp.

### B. Cloud Storage (Google Sheets 3NF)
*   **Sheet: Catalog** (Columns: ID, Name, SAP, CAS, Risks...)
*   **Sheet: Batches** (Columns: ID, CatalogID, Lot, Expiry...)
*   **Sheet: Balances** (Columns: ID, BatchID, LocationID, Qty...)
*   **Sheet: Movements** (Columns: ID, Type, Date, User, Qty...)

## 3. Business Rules

### Inventory Logic
1.  **Atomicity**: Every stock change MUST update `balances` (V2), `stock_movements` (V2), AND `items` (V1) within a single `db.transaction`.
2.  **Negative Stock**: STRICTLY PROHIBITED at the Service Layer.
3.  **Identity**:
    *   `CatalogID` = `CAT-` + Hash(SAP + Name).
    *   `BatchID` = `BAT-` + Hash(CatalogID + LotNumber).
4.  **Audit**: On startup/sync, `runLedgerAudit` compares `Sum(balances)` vs `items.quantity`. If drift > 0.001, V1 is auto-corrected.

### Synchronization Logic
1.  **Queue**: Offline actions are pushed to `syncQueue` table.
2.  **Process**:
    *   Check `navigator.onLine`.
    *   Flush Queue -> POST to GAS.
    *   If Success -> Delete from Queue.
    *   If Fail -> Retry later (Exponential Backoff).
3.  **Smart Merge**: Incoming Cloud Data (READ) is merged into Local DB. Local "Dirty" records (pending sync) take precedence to prevent overwriting user work.

## 4. Interface (API)

**Endpoint:** Google Apps Script Web App URL
**Method:** `POST`
**Content-Type:** `application/json`

| Action | Input | Output | Description |
| :--- | :--- | :--- | :--- |
| `read_full_db` | `{}` | `{ view: [], catalog: [], ... }` | Full Dump for Initial Sync. |
| `sync_transaction` | `{ movements: [], balances: [] }` | `{ success: true }` | Pushes local changes to Cloud. |
| `upsert_item` | `{ item: Item }` | `{ success: true }` | Legacy single-item update. |

## 5. Risk Log (Constraints)
1.  **GAS Timeout**: Requests taking > 30s will fail. *Mitigation:* Chunk large sync payloads.
2.  **Browser Storage Quota**: IndexedDB can be wiped by OS if disk is full. *Mitigation:* Check `navigator.storage.estimate()`.
3.  **Schema Versioning**: Changing Dexie schema requires a version bump and migration script.
