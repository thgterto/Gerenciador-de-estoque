# Plan: Refactor Codebase for SOLID Principles

## Task Overview
**User Request:** Apply SOLID, DRY, KISS, and YAGNI interventions from `docs/CODE_ANALYSIS_SOLID.md`.
**Goal:** Improve maintainability, reduce coupling, and eliminate unused code.
**Focus Areas:** `InventoryService`, `InventoryTable`, `SharePointService`.

## 1. Context & Analysis
- **God Object (`InventoryService`)**: Handles too many distinct domains (CRUD, Sync, Audit, Export).
- **Monolithic UI (`InventoryTable`)**: Difficult to read/test due to mixing layout, filters, and virtualization logic.
- **Fragmented Logic**: Sync logic is scattered between `InventoryService` and `SyncQueueService`.
- **Dead Code (`SharePointService`)**: Heavy dependency that appears unused in favor of Google Sheets.

## 2. Implementation Plan

### Phase 1: Service Layer Refactoring (SRP & DRY)
**Goal:** Decompose `InventoryService` and unify Sync logic.

- [ ] **Create `services/InventorySyncManager.ts`**
  - Move `syncFromCloud` logic here.
  - Implement a `notifyChange(action, payload)` method that encapsulates the "Try GoogleSheets -> Catch -> Enqueue SyncQueue" pattern.
- [ ] **Create `services/InventoryExportService.ts`**
  - Move `exportData` and related helper logic here.
- [ ] **Create `services/InventoryAuditService.ts`**
  - Move `runLedgerAudit` logic here.
- [ ] **Refactor `services/InventoryService.ts`**
  - Remove extracted code.
  - Inject/Call new services where appropriate.
  - Keep only Core CRUD and Transaction logic.

### Phase 2: UI Component Refactoring (SRP)
**Goal:** Break down `InventoryTable` into functional components.

- [ ] **Create `components/inventory/InventoryKPIs.tsx`**
  - Extract the top metric cards section.
- [ ] **Create `components/inventory/InventoryFilters.tsx`**
  - Extract the search, status, location, and category filter bars.
- [ ] **Create `components/inventory/InventoryList.tsx`**
  - Extract the `react-window` list logic (AutoSizer, List, etc.).
- [ ] **Update `components/InventoryTable.tsx`**
  - Orchestrate the above components using `useInventoryFilters`.

### Phase 3: Cleanup (YAGNI)
**Goal:** Remove unused code and dependencies.

- [ ] **Archive `services/SharePointService.ts`**
  - Move to `services/legacy/SharePointService.ts` (or delete if confirmed safe).
  - Remove `@azure/msal-browser` and `@microsoft/microsoft-graph-client` from `package.json` if possible (requires check of other usages).

## 3. Verification Checklist

### Automated Checks
- [ ] `npm run build`: Ensure no type errors after refactoring.
- [ ] `npm run lint`: Ensure code style consistency.

### Manual Verification
- [ ] **Sync**: Verify offline/online sync still works via `InventorySyncManager`.
- [ ] **UI**: Verify Inventory Table filters, sorting, and rendering match previous behavior.
- [ ] **Export**: Generate an export and check file content.

## 4. Agent Assignments
- **Refactoring Agent**: Handle Service and Component splitting.
- **Cleanup Agent**: Handle file moves and dependency cleanup.
