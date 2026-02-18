# Orchestration Plan: LabControl Cleanup & Testing

## Overview
This plan addresses the remaining items from the "Cleanup & Restructuring" PRD, focusing on finalizing the testing infrastructure and verifying the architectural changes.

## Phase 1: Environment & Configuration
**Goal**: Establish a working development environment and configure testing tools.

### Tasks
1.  **Install Dependencies**: Run `npm install` to ensure all packages are available.
2.  **Configure Vitest**:
    - Update `vite.config.ts` or create `vitest.workspace.ts` to support both `jsdom` (Frontend) and `node` (Electron) environments.
    - Ensure `npm test` runs both test suites.

## Phase 2: Test Implementation & Verification
**Goal**: Implement meaningful tests and verify the system stability.

### Tasks
1.  **Update Electron Tests**:
    - Rewrite `tests/electron/ipc.test.ts` to test actual IPC logic (mocking `ipcMain`/`ipcRenderer`).
    - Ensure it runs in the `node` environment.
2.  **Verify Component Tests**:
    - confirm `src/components/__tests__/Tooltip.test.tsx` passes in `jsdom` environment.
3.  **Backend Archival Verification**:
    - Double-check that `_archive/backend/` contains the legacy code.
    - Verify no active code references legacy backend files.

## Success Criteria
- [ ] `npm install` completes successfully.
- [ ] `npm test` runs and passes all tests.
- [ ] Electron tests run in `node` environment.
- [ ] React tests run in `jsdom` environment.
- [ ] No active references to `backend/GoogleAppsScript.js` remain (except in archive/docs).
