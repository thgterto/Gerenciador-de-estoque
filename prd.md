# Product Requirements Document (PRD) - Cleanup & Restructuring

## Overview
The goal of this initiative is to improve the codebase organization, maintainability, and testing coverage of the LabControl UMV project. This involves cleaning up legacy backend code, restructuring the frontend into a standard `src/` directory, enhancing the testing infrastructure with Vitest, and enforcing code quality in the Electron main process.

## 1. Cleanup: Legacy Backend Archival
**Objective**: Remove confusion by archiving deprecated Google Apps Script integration files.

*   **Action**: Move `backend/` directory to `_archive/backend/`.
*   **Affected Files**:
    *   `backend/GoogleAppsScript.js`
    *   `backend/benchmark.js`
*   **Verification**: Ensure no active code references these files (checked via grep). Update `tests/security_checks.py` if necessary or move it to archive if it solely tests the legacy backend.

## 2. Structure: Frontend Migration to `src/`
**Objective**: Adhere to standard Vite/React conventions and declutter the project root.

*   **Action**: Create `src/` directory and move all frontend source code into it.
*   **Files to Move**:
    *   `components/` -> `src/components/`
    *   `context/` -> `src/context/`
    *   `database/` -> `src/database/`
    *   `design-system/` -> `src/design-system/`
    *   `hooks/` -> `src/hooks/`
    *   `services/` -> `src/services/`
    *   `utils/` -> `src/utils/`
    *   `App.tsx` -> `src/App.tsx`
    *   `index.tsx` -> `src/index.tsx`
    *   `index.css` -> `src/index.css`
    *   `theme.ts` -> `src/theme.ts`
    *   `types.ts` -> `src/types.ts`
    *   `vite-env.d.ts` -> `src/vite-env.d.ts`
    *   `db.ts` -> `src/db.ts`
    *   `limsData.ts` -> `src/limsData.ts`
    *   `vitest.setup.ts` -> `src/vitest.setup.ts` (or `tests/setup.ts`)
*   **Configuration Updates**:
    *   `index.html`: Update script source to `/src/index.tsx`.
    *   `vite.config.ts`: Update `test.setupFiles` path.
    *   `tsconfig.json`: Update `include` path to `["src"]`.

## 3. Testing: Active Use of Vitest
**Objective**: Ensure reliable testing for both React components (Frontend) and Electron IPC logic (Backend).

*   **Action**:
    *   Configure Vitest to run tests in both environments if possible, or ensure the config covers both.
    *   Create `tests/electron/` for Electron-specific tests.
    *   Add a sample React component test (e.g., `src/components/App.test.tsx` or similar).
    *   Add a sample Electron IPC test (e.g., `tests/electron/ipc.test.ts`).
*   **Success Criteria**: `npm test` runs and passes both test suites.

## 4. Code Quality: ESLint for Electron
**Objective**: Enforce code style and quality in the Electron backend (`electron/` directory).

*   **Action**:
    *   Update `eslint.config.js` to include `electron/` directory.
    *   Add a configuration override for `electron/**/*.{js,cjs}` to:
        *   Set environment to `node: true`.
        *   Disable React-specific rules.
        *   Enable recommended ESLint rules for JavaScript/Node.
*   **Verification**: Run `npx eslint electron/` and fix reported issues.

## Implementation Patterns & References

*   **Vite Structure**: Standard convention is `src/` for all source code. [Vite Docs](https://vitejs.dev/guide/#scaffolding-your-first-vite-project)
*   **Vitest**: Supports running in Node and JSDOM environments. [Vitest Config](https://vitest.dev/config/)
*   **ESLint Flat Config**: Allows specific configuration for different file patterns within the same project. [ESLint Config](https://eslint.org/docs/latest/use/configure/configuration-files)

## Execution Plan
1.  **Backup**: Create a backup branch (git handle).
2.  **Move & Refactor**: Execute file moves and update configs.
3.  **Linting**: Apply ESLint config updates and fix errors.
4.  **Testing**: Implement basic tests and verify execution.
5.  **Verify**: Build the application (`npm run build`) and start dev server (`npm run dev`) to ensure no regressions.
