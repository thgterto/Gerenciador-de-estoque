# LabControl Codebase Analysis

## 1. Project Overview

**LabControl** (formerly Laboratory Inventory Management System) is a mission-critical platform for laboratory inventory management. It has been re-architected as a **Portable Desktop Application** using **Electron**, ensuring local data integrity and offline capabilities.

### Key Architecture Components:
-   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
-   **Desktop Wrapper**: Electron 34 (Chromium + Node.js).
-   **Persistence Layer**:
    -   **Local (Renderer)**: IndexedDB via **Dexie.js** for fast, offline-first data access in the UI.
    -   **System (Main)**: SQLite via **better-sqlite3** for robust, transactional data storage and backups.
-   **Legacy Backend**: A `GoogleAppsScript.js` file existed in `backend/` but has been archived to `_archive/backend/` to prevent confusion with the current local architecture.

### Core Features:
-   **Inventory Management**: High-performance list virtualization for large datasets.
-   **Data Import/Export**: Advanced Excel import with smart merging and GHS risk detection.
-   **Storage Matrix**: Visual 8x6 grid for physical storage management.
-   **Chemical Intelligence**: Integration with CAS Common Chemistry API for automated data enrichment.
-   **Traceability**: Ledger-based history for full audit trails.
-   **Portable Distribution**: Runs directly from an executable with a local data folder, requiring no installation.

## 2. Workflow Analysis

### Preview Workflow (`.agent/workflows/preview.md`)
The project includes a specific workflow for managing a local preview server, likely for development or demonstration purposes.

-   **Tool**: `.agent/scripts/auto_preview.py` (Python script).
-   **Functionality**:
    -   **Detection**: Checks `package.json` for `dev` or `start` scripts.
    -   **Execution**: Launches the server using `subprocess.Popen`, capturing output to `.agent/preview.log`.
    -   **Management**: Uses a PID file (`.agent/preview.pid`) to track and manage the process.
-   **Commands**:
    -   `/preview`: Status check.
    -   `/preview start`: Starts the server (defaults to port 3000).
    -   `/preview stop`: Stops the server.
    -   `/preview check`: Health check.
-   **Context**: This workflow appears to be an abstraction layer for the underlying `npm` scripts, providing a unified interface for the "agent" or developer to manage the running application instance.

### NPM Scripts (`package.json`)
-   `dev`: Runs `vite` (Standard web development).
-   `electron:dev`: Runs `vite` and `electron` concurrently for desktop development.
-   `build`: Runs `tsc` (TypeScript type check) and `vite build`.
-   `electron:build`: Builds the web app and then packages it with `electron-builder`.

## 3. Codebase Structure Assessment

The codebase now follows a standard React/Vite structure, with all frontend source code residing in the `src/` directory.

### Key Directories:
-   `src/`: **Frontend Source**. Contains all React application code:
    -   `components/`: UI components.
    -   `context/`: React Context definitions.
    -   `data/`: Static data files (e.g., LIMS real data).
    -   `hooks/`: Custom React hooks.
    -   `services/`: Frontend services (API calls, Dexie interaction).
    -   `utils/`: Utility functions.
    -   `database/`: Dexie schema and configuration.
    -   `App.tsx`, `index.tsx`: Entry points.
-   `electron/`: **Main Process**. Contains the Electron backend logic, including:
    -   `main.cjs`: Entry point.
    -   `preload.cjs`: IPC bridge.
    -   `controllers/`: Business logic for the main process.
    -   `db/`: SQLite database handling.
-   `_archive/`: **Archived Code**. Contains legacy backend code (`GoogleAppsScript.js`) and unused benchmarks.
-   `tests/`: **Test Suite**. Contains integration and E2E tests, including:
    -   `electron/`: Specific tests for Electron IPC logic.
-   `public/`: Static assets.
-   `release/`: Output directory for Electron builds.
-   `dist/`: Output directory for Vite builds.

### Root Files:
-   `vite.config.ts`: Vite configuration, pointing to `src/` and handling test setup.
-   `tsconfig.json`: TypeScript configuration including `src` and `tests`.
-   `eslint.config.js`: ESLint configuration covering both `src` (React/TS) and `electron` (Node/JS).

## 4. Configuration Review

### `package.json`
-   **Dependencies**:
    -   React 19 (Latest stable).
    -   Electron 34.
    -   Better-SQLite3 & Dexie for data.
    -   MUI & Tailwind for UI.
    -   Recharts/ApexCharts for visualization.
-   **Scripts**: Well-defined scripts for dev and build workflows.

### `vite.config.ts`
-   Configured for both web and Electron environments (`base: './'` for Electron portability).
-   Manual chunking configured for build optimization.
-   Test configuration using Vitest, pointing to `src/vitest.setup.ts`.

### `tsconfig.json`
-   Target: ES2020.
-   Strict mode enabled.
-   Includes `src` and `tests` directories.

### Linting (`eslint.config.js`)
-   **Frontend**: Standard React + TypeScript configuration for `src/`.
-   **Backend**: Specific configuration for `electron/` directory (Node environment, no React rules).
-   **Tailwind**: Configured to scan `src/` for class usage.

## 5. Summary & Implemented Improvements

The **LabControl** project has been successfully restructured to improve maintainability and developer experience.

**Completed Improvements:**
1.  **Cleanup**: The legacy `backend/` directory has been moved to `_archive/backend/`, removing ambiguity about the active backend logic.
2.  **Structure**: All frontend source files have been moved to `src/`, decluttering the root directory and following standard React conventions.
3.  **Testing**: A comprehensive testing infrastructure using **Vitest** is now in place, covering both React components (in `src/components/__tests__`) and Electron IPC logic (in `tests/electron`).
4.  **Code Quality**: An **ESLint** configuration has been added for the `electron/` directory, ensuring consistent code quality across the full stack.
5.  **Rendering Fix**: Tailwind CSS configuration was updated to correctly locate source files in the new `src/` directory, ensuring proper styling.
