# Debug Report: Persistence & Broken Tables

## 1. Reproduce
**Issue:** Database tables appeared broken or empty, and persistence was not working as expected.
**Observation:**
- The application started with an empty inventory.
- `verify_seed.py` confirmed "ACIDO-OXALICO" (present in source Excel) was missing.
- Browser console showed potential errors related to undefined tables or missing data.

## 2. Isolate
**Root Cause Analysis:**
1.  **Missing V2 Table Definitions in Wrapper:**
    -   The `HybridStorageManager` class in `utils/HybridStorage.ts` only initialized V1 legacy tables (`items`, `history`, `balances`).
    -   It failed to initialize V2 normalized tables (`catalog`, `batches`, `partners`, `storage_locations`, `stock_movements`) which are essential for the new architecture.
    -   Any attempt to access `db.catalog` or other V2 tables via the wrapper would fail or return undefined, breaking persistence for these entities.

2.  **Lack of Initial Data:**
    -   The database was empty, and there was no mechanism to seed it with the provided `dados_normalizados_v2.xlsx`.
    -   Existing seeding logic (`services/DatabaseSeeder.ts`) relied on default/legacy data (`limsData.ts`) which might be outdated or not matching the user's new source file.

## 3. Understand
The system is in a hybrid state (migrating from V1 to V2).
- **Persistence Failure:** Occurred because the software layer (`HybridStorage`) was out of sync with the database schema (`QStockDB`).
- **Broken Tables:** likely refers to the UI showing empty tables or crashing when trying to fetch V2 data that wasn't exposed by the storage layer.

## 4. Fix & Verify
**Fixes Implemented:**
1.  **Updated `utils/HybridStorage.ts`:**
    -   Added public properties for all V2 tables (`catalog`, `batches`, etc.).
    -   Initialized `HybridTableWrapper` for each V2 table in the constructor.

2.  **Created Data Seeder (`utils/seeder.ts`):**
    -   Parsed the user's Excel file (`dados_normalizados_v2.xlsx`) into a normalized JSON format (`database/seed_data.json`).
    -   Implemented a robust seeding script that populates both V2 tables (for persistence) and V1 tables (for UI compatibility) on application start if the DB is empty.

3.  **Integrated Seeder in `App.tsx`:**
    -   Added `seedDatabase()` call to the main application effect hook.

**Verification:**
-   **Build:** `npx vite build` passed successfully.
-   **Frontend Verification:**
    -   Created `verification/verify_search_clean.py` using Playwright.
    -   Script successfully found "ACIDO-OXALICO" in the inventory search results.
    -   Screenshot `verification/inventory_search_clean.png` confirms the presence of data (1251 items).

## 5. Conclusion
The persistence layer is now correctly configured to handle V2 entities, and the database is successfully populated with the provided business data.
