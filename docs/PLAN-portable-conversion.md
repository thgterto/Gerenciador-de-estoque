# Portable Application Conversion Plan

## Overview

We are converting LabControl from a Hybrid (Cloud/Local) architecture to a fully Portable (Local-Only) architecture. This involves migrating business logic from Google Apps Script (GAS) to the Electron Main Process (Node.js) and using SQLite as the primary source of truth for the portable distribution.

**Goal:** Create a self-contained `.exe`/`.AppImage` that runs without any dependency on Google Sheets or external servers.

## Current Architecture vs. Target Architecture

| Component | Current (Cloud/Hybrid) | Target (Portable) |
| :--- | :--- | :--- |
| **Frontend** | React 19 (Web) | React 19 (Electron Renderer) |
| **Backend Logic** | Google Apps Script (GAS) | Electron Main Process (Node.js) |
| **Database** | Google Sheets + IndexedDB | SQLite (via `better-sqlite3`) |
| **API Transport** | `fetch()` to GAS URL | Electron IPC (`ipcRenderer.invoke`) |

## Implementation Phases

### Phase 1: Backend Logic Migration (Node.js Port)

We need to port the logic currently in `backend/GoogleAppsScript.js` to a modular Node.js structure within the Electron environment.

#### 1.1 Create Controller Layer
**File:** `electron/controllers/InventoryController.js`
- **Action:** Port `legacyUpsertItem` logic.
- **Details:**
  - Implement the ID derivation heuristics used in GAS:
    - If `catalogId` is missing, split `item.id` by `-`. The `catalogId` is the prefix (everything except the last part).
    - Example: `SAP123-LOT456` -> `CAT-SAP123`.
  - Ensure `Catalog`, `Batch`, and `Balance` are upserted in a single SQLite transaction.
  - Use `better-sqlite3`'s `.transaction()` wrapper.
- **Dependency:** `electron/db.cjs`

#### 1.2 Port Import Logic
**File:** `electron/controllers/ImportController.js`
- **Action:** Port `bulkLogMovements` and Excel parsing helpers.
- **Details:**
  - `handleSyncTransaction(payload)`: Accepts `{ catalog, batches, balances }`.
  - **Performance:** Use prepared statements (`db.prepare`) inside a loop within a transaction for bulk inserts.
  - **Error Handling:** If any row fails (e.g., constraint violation), the entire batch must roll back. Return specific error indices to the UI.

### Phase 2: Database Layer Enhancement

The current `electron/db.cjs` is a minimal implementation. We need to expand it to match the full schema capabilities of the GAS backend.

#### 2.1 Expand Schema
**File:** `electron/db/schema.sql`
- **Action:** Add the following tables:

  ```sql
  CREATE TABLE IF NOT EXISTS systemConfigs (
      key TEXT PRIMARY KEY,
      value TEXT, -- JSON string
      category TEXT,
      updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS syncQueue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      payload TEXT NOT NULL, -- JSON
      status TEXT DEFAULT 'PENDING', -- PENDING, FAILED
      createdAt TEXT,
      retryCount INTEGER DEFAULT 0
  );
  ```

#### 2.2 Enhance `db.cjs`
**File:** `electron/db.cjs`
- **Action:** Add methods:
    - `getSystemConfig(key)`: Returns parsed JSON value.
    - `setSystemConfig(key, value)`: Stringifies JSON and upserts.
    - `processOfflineQueue()`: (Placeholder) Logic to retry failed cloud syncs if we add hybrid mode later.

### Phase 3: Frontend Service Unification

The frontend currently checks `GoogleSheetsService.isConfigured()` to decide whether to sync. We need to abstract this so "configured" can also mean "running in Electron".

#### 3.1 Abstract API Client
**File:** `services/ApiClient.ts` (New)
- **Interface:**
  ```typescript
  interface ApiClient {
    request(action: string, payload?: any): Promise<ApiResponse>;
    isOnline(): boolean;
  }
  ```
- **Implementation Strategy:**
  - Create a factory `getApiClient()` that returns `ElectronClient` if `window.electronAPI` exists, otherwise returns `WebClient` (Google Sheets).

#### 3.2 Refactor `InventorySyncManager`
**File:** `services/InventorySyncManager.ts`
- **Action:** Update `syncFromCloud` to call `ApiClient.fetchFullDatabase()` instead of hardcoding Google Sheets.
- **Logic:**
  - **Web Mode:** `ApiClient` calls GAS URL.
  - **Electron Mode:** `ApiClient` calls `ipcRenderer.invoke('db:read-full')`.
  - **Response Normalization:** Ensure both return exactly `{ view, catalog, batches, balances }` structure.

### Phase 4: Packaging & Distribution

#### 4.1 Update `electron-builder` Config
**File:** `package.json`
- **Action:** Ensure `labcontrol_data` folder creation logic in `main.cjs` works correctly in the packaged version.
- **Details:**
  - Use `app.getPath('userData')` redirection logic.
  - Handle `asar` packing: Ensure `schema.sql` is included in `extraResources` or read from the correct path inside the bundle.

#### 4.2 Smoke Testing
- **Action:** Verify that a fresh install on a new machine (VM) creates the DB and runs without internet.
- **Scenario:**
  1. Install on fresh VM (no Node.js installed).
  2. Launch App.
  3. Verify `labcontrol_data/labcontrol.db` is created.
  4. Add Item "Test Reagent".
  5. Close & Reopen.
  6. Verify "Test Reagent" exists.
