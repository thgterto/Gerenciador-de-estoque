# Correction Plan: Code Review Audit Findings

## Goal
Implement corrections for the issues identified in `thoughts/code_review_initial_audit.md`, focusing on code quality, maintainability, and performance.

## Tasks

### Phase 1: Code Quality & Maintenance
- [ ] **Refactor Routing**: Extract routing logic from `src/App.tsx` into a new `src/AppRoutes.tsx` component.
    - **Verify**: `npx vite build` succeeds, app navigation works identically.
    - **Affected Files**: `src/App.tsx`, `src/AppRoutes.tsx` (new).
- [ ] **Centralize Constants**: Create `src/config/constants.ts` for storage keys (e.g., `'LC_TUTORIAL_ENABLED'`) and other hardcoded strings.
    - **Verify**: Grep for moved strings returns only the constants file.
    - **Affected Files**: `src/App.tsx`, `src/config/constants.ts` (new).
- [ ] **Enhance Type Safety**: Add `SapOrder` and `SapOrderItem` interfaces to `src/types.ts` and replace `any` usage in `src/db.ts`.
    - **Verify**: `tsc` (or build) passes with no new errors.
    - **Affected Files**: `src/types.ts`, `src/db.ts`.
- [ ] **Fix Magic Strings in DB**: Replace string literals for table names (e.g., `'batches'`, `'catalog'`) with constants in `src/db.ts` or `src/config/constants.ts`.
    - **Verify**: Check `src/db.ts` for raw strings in hooks.
    - **Affected Files**: `src/db.ts`, `src/config/constants.ts`.

### Phase 2: Input Validation
- [ ] **Improve File Import Validation**: Update `importLegacyExcel` in `src/hooks/useStockOperations.ts` to strictly validate file MIME type and extension before processing.
    - **Verify**: Attempt to upload a non-Excel file and confirm it is rejected with a clear error message.
    - **Affected Files**: `src/hooks/useStockOperations.ts`.

### Phase 3: Build Optimization
- [ ] **Resolve Dynamic Import Conflicts**: Modify `src/components/Settings.tsx` and other consumers to use consistent import patterns (dynamic vs static) for `GoogleSheetsService` and `DatabaseSeeder`.
    - **Verify**: Run `npx vite build` and check for the warning "dynamic import will not move module into another chunk".
    - **Affected Files**: `src/components/Settings.tsx`, `src/services/ApiClient.ts`, `src/services/SyncQueueService.ts`, `src/hooks/useInventoryData.ts`.
- [ ] **Optimize Bundle Size**: Investigate why `xlsx` might be leaking into the main bundle despite `vite.config.ts` manual chunks. Ensure `utils` chunk is properly generated.
    - **Verify**: Inspect `dist/assets` after build to confirm `utils-*.js` size and main bundle reduction.
    - **Affected Files**: `vite.config.ts`.

## Done When
- [ ] All "Verify" steps pass.
- [ ] `npx vite build` completes without warnings regarding dynamic imports.
- [ ] Type safety is improved (fewer `any` types in `db.ts`).
