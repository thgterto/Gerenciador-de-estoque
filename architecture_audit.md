# 🛡️ ARCHITECTURE AUDIT & CRITICAL TRADE-OFFS

## 1. Core Architecture: "Hybrid Offline-First LIMS"

The system is designed around a **Local-First** philosophy, prioritizing data availability and UI responsiveness over immediate consistency.

### 🔍 Why this stack?
*   **React 19 + Vite:** Provides a modern, high-performance UI layer capable of handling complex state (Inventory Grids) with "Zero Flickering".
*   **Dexie.js (IndexedDB):** Essential for the "Offline-First" requirement. It acts not just as a cache, but as the *primary* database for the user.
*   **Google Apps Script (GAS) + Sheets:** A pragmatic choice for a "Serverless" backend. It eliminates hosting costs and leverages existing infrastructure (Google Workspace) but introduces unique constraints.

## 2. Critical Trade-offs

### A. The "Dual Ledger" Strategy (Risk vs Speed)
*   **Design:** The system maintains two parallel data structures:
    *   **V1 (Snapshot):** A denormalized `items` table for instant UI rendering.
    *   **V2 (Ledger):** Normalized `balances` and `stock_movements` tables for accounting integrity.
*   **Trade-off:** We trade **Storage Space** and **Complexity** (dual writes) for **Read Performance**.
*   **Risk:** "Data Drift" where V1 != Sum(V2).
*   **Mitigation:** `InventoryService.runLedgerAudit` exists to detect and repair this drift.

### B. Synchronization Model (Smart Merge vs CRDT)
*   **Design:** "Last Write Wins" with a "Smart Merge" strategy that preserves local enrichment (formulas, risks) while updating quantities.
*   **Trade-off:** Simple implementation vs True multi-user conflict resolution.
*   **Risk:** If two users edit the *same* item offline, one change will be overwritten.
*   **Mitigation:** `LockService` in GAS serializes writes, but offline conflicts are resolved by timestamp (LWW).

### C. GAS Concurrency Bottleneck
*   **Design:** `doPost` uses `LockService.getScriptLock()` to prevent race conditions in Google Sheets.
*   **Trade-off:** Data Integrity vs Throughput.
*   **Risk:** High write volume will result in timeouts (30s wait limit).
*   **Mitigation:** The frontend `SyncQueueService` must throttle requests or batch them (which it does via `sync_transaction`).

## 3. Simplified Scope (YAGNI)
*   **No Real-time Sockets:** Implementation uses polling/queueing instead of WebSockets to keep the backend simple (GAS doesn't support persistent connections).
*   **No Foreign Key Constraints in DB:** IndexedDB is NoSQL. Integrity is enforced at the Application Layer (`InventoryService`), not the Database Layer.

## 4. Replication Requirements
To replicate this tool, the "Builder" must respect:
1.  **Atomic Transactions:** All writes to V1 and V2 must happen in a `db.transaction`.
2.  **Immutable Ledger:** `stock_movements` are append-only.
3.  **Strict Typing:** TypeScript interfaces must define the exact shape of V1 and V2 entities to prevent runtime errors.
