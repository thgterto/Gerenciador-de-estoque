---
date: 2026-01-23T00:00:00Z
researcher: Jules
git_commit: HEAD
branch: main
repository: LabControl
topic: "Initial Codebase Analysis & Architecture Review"
tags: [research, architecture, codebase, react, dexie, gas]
status: complete
last_updated: 2026-01-23
last_updated_by: Jules
---

# Research: Initial Codebase Analysis & Architecture Review

**Date**: 2026-01-23
**Researcher**: Jules
**Repository**: LabControl

## Research Question
"Execute research_codebase.md" - Comprehensive analysis of the existing codebase to understand architecture, data flow, and key components.

## Summary
LabControl is a "Mission Critical" Laboratory Inventory Management System (LIMS) designed with an **Offline-First** architecture. It uses **React 19** for the frontend, **Electron** for desktop packaging, and **Dexie.js (IndexedDB)** for local persistence. The backend is a hybrid system utilizing **Google Apps Script (GAS)** and **Google Sheets** as a cloud relational database, connected via a synchronization engine.

## Detailed Findings

### 1. Architecture: Hybrid Offline-First
**File**: `README.md`, `db.ts`
The system implements a "Dual Layer" architecture:
- **L1 (Memory):** Fast access for React UI.
- **L3 (Persistence):** Dexie.js (IndexedDB) stores data locally in the browser/electron wrapper.
- **Cloud Sync:** Syncs with Google Sheets via GAS.

The Data Model has evolved from a simple "Snapshot" (V1) to a "Ledger" (V2) based system:
- **V1 (Legacy/UI):** Flat `items` table for quick display.
- **V2 (Ledger):** Normalized tables (`balances`, `batches`, `stock_movements`) that act as the source of truth.

### 2. Frontend Core
**Files**: `package.json`, `vite.config.ts`
- **Framework**: React 19
- **Build Tool**: Vite 6
- **Language**: TypeScript 5
- **UI Library**: Tailwind CSS
- **Visualization**: ApexCharts / ECharts
- **Virtualization**: `react-window` is used for handling large inventory lists efficiently.

### 3. Backend & Synchronization
**File**: `backend/GoogleAppsScript.js`
- **Platform**: Google Apps Script (Serverless).
- **Database**: Google Sheets (acting as a relational DB).
- **Concurrency**: Implements `LockService` to handle concurrent requests (simulating transactions).
- **Endpoints**: `doPost` handles JSON RPC-style actions (`sync_transaction`, `read_full_db`, `upsert_item`).
- **Data Model on Sheets**: 3NF (3rd Normal Form) with sheets for `Catalog`, `Batches`, `Balances`, and `Movements`.

### 4. Key Services
**File**: `services/InventoryService.ts`
- **InventoryService**: The main facade. It orchestrates writes to Dexie and queues sync jobs for the cloud.
- **Transaction Logic**:
  - Validates inputs.
  - Writes atomically to Dexie (`db.transaction`).
  - Updates "Snapshot" (V1) for UI.
  - Updates "Ledger" (V2) for accounting.
  - Triggers Cloud Sync (or queues it if offline).

## Architecture Documentation

### Data Flow (Write Operation)
1. **UI Event** -> `InventoryService.processTransaction`
2. **Local Commit** -> `LedgerService` (Write to Dexie `stock_movements`)
3. **State Update** -> `SnapshotService` (Update Dexie `items` V1 view)
4. **Cloud Sync** -> `GoogleSheetsService` -> `backend/GoogleAppsScript.js`

### Data Flow (Read Operation)
- **UI** -> Reads from Dexie `items` (V1) or `balances` (V2) directly (Fast, Zero Latency).
- **Sync** -> Pulls full state from GAS on load (Smart Merge strategy).

## Open Questions
- **Auth**: How is authentication handled? `package.json` mentions `@azure/msal-browser`, but `backend/GoogleAppsScript.js` seems to have open endpoints (secured by script deployment visibility?).
- **Testing**: No test runner configured in `package.json` scripts, though `tests/` directory exists.
- **Multi-user**: How are conflicts handled beyond the "Last Write Wins" or simple "Smart Merge"?
