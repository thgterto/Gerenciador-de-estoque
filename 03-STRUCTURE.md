# 03-STRUCTURE.md (File Tree)

## 1. Project Root
*   `package.json`: Dependencies and Scripts.
*   `vite.config.ts`: Build configuration.
*   `tailwind.config.js`: Styling configuration.
*   `tsconfig.json`: TypeScript configuration.
*   `index.html`: Entry point.
*   `electron/`: Electron wrapper main process.

## 2. Source Code (`/src` implicit in logic, actual root in this repo)

### A. Core Logic
*   `db.ts`: **CRITICAL**. Dexie Database definition and Schema versioning.
*   `types.ts`: TypeScript Interfaces for V1, V2, and DTOs.
*   `App.tsx`: Main Router and Layout composition.
*   `index.tsx`: React Entry point.

### B. Service Layer (`/services`)
*Facade pattern for Business Logic*
*   `InventoryService.ts`: **Main Facade**. Orchestrates Transactions.
*   `LedgerService.ts`: Handles V2 Write operations (`stock_movements`).
*   `SnapshotService.ts`: Handles V1 Read-Model updates (`items`).
*   `SyncQueueService.ts`: Manages Offline Queue and Retry logic.
*   `GoogleSheetsService.ts`: Cloud API Client.
*   `ImportService.ts`: Excel/CSV parsing logic.
*   `CasApiService.ts`: External chemical data lookup.

### C. Backend (`/backend`)
*   `GoogleAppsScript.js`: **Serverless Backend**. Deployed to Google Apps Script.

### D. Data Access & State (`/hooks`, `/context`)
*   `hooks/useInventoryData.ts`: React Query-like hook for Dexie LiveQuery.
*   `hooks/useStockOperations.ts`: Wrapper around InventoryService for UI.
*   `hooks/useScanner.ts`: Barcode scanner integration.
*   `context/AuthContext.tsx`: User session state.

### E. UI Components (`/components`)

#### Features
*   `InventoryTable.tsx`: Main Virtualized Grid (React-Window).
*   `AddItem.tsx`: New Item Form.
*   `HistoryTable.tsx`: Audit Log View.
*   `Dashboard.tsx`: Analytics Widgets.
*   `BatchList.tsx`: V2 Batch/Lote Detail View.
*   `ImportWizard.tsx`: Excel Import UI.

#### Shared UI (`/components/ui`)
*   `Button.tsx`, `Input.tsx`, `Modal.tsx`, `Card.tsx`: Atomic Design components.
*   `Layout.tsx`: Main Shell (Sidebar + Header).

### F. Utilities (`/utils`)
*   `HybridStorage.ts`: **Advanced**. L1/L3 Cache Manager.
*   `MigrationV2.ts`: Schema upgrade logic.
*   `ExportEngine.ts`: Excel export logic.
*   `businessRules.ts`: Validation constants.

## 3. Directory Structure

```text
.
├── backend/
│   └── GoogleAppsScript.js     # Cloud Backend
├── components/
│   ├── ui/                     # Generic UI Kit
│   ├── InventoryTable.tsx      # Core Grid
│   ├── BatchList.tsx           # V2 Details
│   └── ...
├── config/
│   └── apiConfig.ts            # GAS URL
├── context/
│   └── AuthContext.tsx
├── database/
│   └── schema.dbml             # Visual Schema
├── electron/
│   ├── main.cjs                # Desktop Wrapper
│   └── preload.cjs
├── hooks/
│   └── ...                     # Logic Hooks
├── services/
│   ├── InventoryService.ts     # Business Logic Root
│   └── ...
├── utils/
│   ├── HybridStorage.ts        # Performance Layer
│   └── ...
├── db.ts                       # Database Definition
├── types.ts                    # Type Definitions
└── App.tsx                     # Router
```
