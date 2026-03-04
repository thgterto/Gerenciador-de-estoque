# SPFx Migration Plan: LabControl UMV

## Overview
This document outlines the strategy for migrating the LabControl application from its current architecture to SharePoint Framework (SPFx).

## Current Architecture
- **Runtime:** Electron (Desktop Portable)
- **Frontend Framework:** React 19, Vite
- **Storage/Backend:** IndexedDB via Dexie.js (V2 Hybrid Architecture), Better-SQLite3
- **Data Model:** Highly normalized (Ledger Relacional) with tables for `catalog`, `batches`, `balances`, `history`, `items`.

## Target Architecture (SPFx)
- **Runtime:** SharePoint Web Part (runs in browser within SharePoint context)
- **Frontend Framework:** React (version matching the SPFx toolchain, currently ~v17 or v18), Webpack/Gulp
- **Storage/Backend:** SharePoint Lists or external Dataverse/SQL via SPFx PnPjs/Graph APIs
- **Libraries:** `@pnp/sp` (PnPjs) for list operations.

## Key Migration Steps

### 1. Build & Tooling Setup
- The `electron` folder, `vite.config.ts`, `main.cjs` will become obsolete.
- A new SPFx project must be generated using the Yeoman generator (`yo @microsoft/sharepoint`).
- Source files from `src/` will be migrated into the SPFx `src/webparts/[WebPartName]/components/` directory.
- `package.json` will be replaced by the SPFx generated one, requiring a careful merge of UI dependencies (Tailwind, MUI, etc.) ensuring compatibility with the SPFx React version.

### 2. Storage & Service Layer Migration
The most significant change is replacing IndexedDB/Dexie with SharePoint Lists.
- **Data Mapping:**
  - `catalog` -> SP List: `LabControl_Catalog`
  - `batches` -> SP List: `LabControl_Batches`
  - `balances` -> SP List: `LabControl_Balances`
  - `history` -> SP List: `LabControl_History`
- **Service Refactoring:**
  - `src/db.ts` (Dexie configuration) will be removed.
  - Services like `InventoryService.ts`, `LedgerService.ts` will be rewritten to use PnPjs.
  - The `processTransaction` atomic operations will need to use SharePoint Batching to ensure data integrity across multiple lists.

### 3. UI Adjustments
- Verify Material-UI and Tailwind CSS do not conflict with SharePoint's native styles. Scoping or prefixing might be required.
- Routing (`react-router-dom`) might need to be switched to `HashRouter` or `MemoryRouter` depending on how the web part is intended to be used (Single Page App within a web part vs. multiple web parts).

## Proof of Concept
A mock service layer (`src/spfx/services/InventoryService.ts`) has been created to demonstrate how the existing `validateItemPayload` and `processTransaction` functions will be structured using theoretical PnPjs patterns instead of Dexie.