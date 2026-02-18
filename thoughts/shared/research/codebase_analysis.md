# LabControl Codebase Analysis

## 1. Project Overview

**LabControl** (formerly Laboratory Inventory Management System) is a mission-critical platform for laboratory inventory management. It has been re-architected as a **Portable Desktop Application** using **Electron**, ensuring local data integrity and offline capabilities.

### Key Architecture Components:
-   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
-   **Desktop Wrapper**: Electron 34 (Chromium + Node.js).
-   **Persistence Layer**:
    -   **Local (Renderer)**: IndexedDB via **Dexie.js** for fast, offline-first data access in the UI.
    -   **System (Main)**: SQLite via **better-sqlite3** for robust, transactional data storage and backups.
-   **Legacy Backend**: A `GoogleAppsScript.js` file exists in `backend/`, indicating a migration from a cloud-based Google Sheets backend to the current local architecture.

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

The codebase follows a somewhat flat structure for the frontend source, with key directories at the root level rather than nested in `src/`. This unconventional structure places source files directly alongside configuration files.

### Key Directories:
-   `electron/`: **Main Process**. Contains the Electron backend logic, including:
    -   `main.cjs`: Entry point.
    -   `preload.cjs`: IPC bridge.
    -   `controllers/`: Business logic for the main process.
    -   `db/`: SQLite database handling.
-   `backend/`: **Legacy**. Contains `GoogleAppsScript.js` and benchmarks.
-   `components/`: React UI components.
-   `hooks/`: Custom React hooks.
-   `services/`: Frontend services (likely API calls, Dexie interaction).
-   `utils/`: Utility functions.
-   `context/`: React Context definitions.
-   `database/`: Database schemas or configurations (likely for Dexie).
-   `public/`: Static assets.
-   `release/`: Output directory for Electron builds.
-   `dist/`: Output directory for Vite builds.

### Root Files:
-   `App.tsx`, `index.tsx`: React application entry points.
-   `vite.config.ts`: Vite configuration.
-   `tsconfig.json`: TypeScript configuration.

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
-   Test configuration using Vitest.

### `tsconfig.json`
-   Target: ES2020.
-   Strict mode enabled.
-   Excludes `electron` folder (which likely has its own config or uses JS).

### Linting (`eslint.config.js`)
-   Standard React + TypeScript configuration.
-   **Important**: Explicitly ignores the `electron/` directory, meaning the backend code is currently not being linted.

## 5. Summary & Recommendations

The **LabControl** project is a modern, robust desktop application built with web technologies. The migration to Electron + SQLite/IndexedDB provides the necessary stability and offline capabilities for a laboratory environment.

**Recommendations:**
1.  **Cleanup**: Consider archiving or removing the `backend/` directory if the Google Apps Script integration is fully deprecated to avoid confusion.
2.  **Structure**: Moving frontend source files (`components`, `hooks`, `services`, `utils`, `App.tsx`, `index.tsx`) into a `src/` directory would improve root directory cleanliness and follow standard conventions.
3.  **Testing**: Ensure `vitest` is actively used and covers both the React components and the Electron IPC logic.
4.  **Code Quality**: Introduce an ESLint configuration for the `electron/` directory to ensure code quality and consistency in the backend logic.
