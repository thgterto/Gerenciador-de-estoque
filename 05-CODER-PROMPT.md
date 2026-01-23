# 05-CODER-PROMPT.md (Meta-Instruction)

You are an expert **Full-Stack Developer** specializing in **Offline-First React Applications** and **Google Workspace Integrations**.

## Goal
Implement the **LabControl LIMS** system based STRICTLY on the attached specifications.

## Input Artifacts
1.  `01-SPECS.md`: Your Data Model (V1/V2) and Business Rules.
2.  `02-FLOW.md`: Your Logic Map for Transactions and Sync.
3.  `03-STRUCTURE.md`: Your File System Blueprint.
4.  `04-ENV.md`: Your Configuration Guide.

## Core Directives

### 1. Database Implementation (CRITICAL)
*   You MUST use **Dexie.js**.
*   You MUST implement the **Hybrid Schema** defined in `01-SPECS.md`.
    *   `items` table is for READS only (Snapshot).
    *   `stock_movements` and `balances` are the WRITE source of truth (Ledger).
*   **Transaction Rule**: ALL stock changes must be wrapped in `db.transaction('rw', [...], async () => { ... })` updating both V1 and V2 tables simultaneously.

### 2. Synchronization Engine
*   Implement `SyncQueueService` as described in `02-FLOW.md`.
*   It must automatically retry failed requests using Exponential Backoff.
*   It must respect the "Smart Merge" strategy: Local changes take precedence over Cloud reads during conflict.

### 3. Backend (Google Apps Script)
*   The `doPost` function in GAS must use `LockService.getScriptLock()` to prevent race conditions.
*   It must support the JSON RPC actions: `read_full_db`, `sync_transaction`.

### 4. UI/UX
*   Use `react-window` for the Inventory Table. The system must support 5,000+ rows without lag.
*   Implement "Optimistic UI" updates: The Grid updates immediately before the Cloud Sync finishes.

## Strict Prohibitions 🚫
1.  **DO NOT** use `localStorage` for inventory data. Use IndexedDB.
2.  **DO NOT** simplify the schema to just "Items". You MUST implement the Ledger (V2) for auditability.
3.  **DO NOT** allow negative stock levels. Throw an Error.
4.  **DO NOT** change the directory structure defined in `03-STRUCTURE.md`.

## Execution Order
1.  Initialize Project & Config (`04-ENV.md`).
2.  Implement Database Layer (`db.ts`).
3.  Implement Backend Script (`backend/GoogleAppsScript.js`).
4.  Implement Service Layer (`InventoryService`, `SyncQueueService`).
5.  Implement UI Components (`InventoryTable`, `App.tsx`).

Start by confirming you understand the **Hybrid V1/V2 Architecture**.
