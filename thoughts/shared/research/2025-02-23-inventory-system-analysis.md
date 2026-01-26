---
date: 2025-02-23T14:30:00Z
researcher: Jules
repository: labcontrol-umv
topic: "Inventory System Analysis: UX, Integrity, and Import Issues"
tags: [inventory, bugs, ux, data-import, system-design]
status: complete
last_updated: 2025-02-23
last_updated_by: Jules
---

# Research: Inventory System Analysis

**Date**: 2025-02-23
**Researcher**: Jules
**Repository**: labcontrol-umv

## Research Question
Analyze the codebase to identify root causes for:
- Inventory Screen issues (cut-off text, table rendering).
- Data integrity and parsing issues (History dates, CAS inference, Normalization, Expiry date validation).
- System design and DTO corrections.
- Graph functionality.

## Summary
The analysis reveals that the reported issues stem from a combination of **rigid UI layout assumptions** (fixed pixel widths), **lack of robust date normalization** during import (relying on raw strings), and a **hybrid data architecture** (V1/V2) that requires complex synchronization.

The "Table not rendered" issue is likely a layout styling conflict where the virtualized list container has zero height. The "History Date" issue is caused by the `DataMapper` accepting raw SQL date strings without converting them to the system-standard ISO 8601 format, causing downstream failures in Graphs and sorting.

## Detailed Findings

### 1. Inventory Screen Issues

#### Text Cut-off in Cards
- **Location**: `components/InventoryRows.tsx`
- **Cause**: The `InventoryChildRow` and `InventoryGroupRow` use a fixed CSS Grid template:
  ```typescript
  const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";
  ```
- **Finding**: Several columns have fixed pixel widths (e.g., 100px for Status, 120px for Category). The `InventoryChildRow` uses `truncate` class on these cells. If content exceeds these widths, it is cut off with no tooltip or wrap option in some cases (though `title` attributes exist in some).
- **Mobile**: The mobile view (`InventoryMobileChildRow`) also has fixed padding and structure that may not accommodate long chemical names.

#### Table Not Rendered
- **Location**: `components/InventoryTable.tsx`, `components/ui/PageContainer.tsx`
- **Cause**: The table uses `react-window`'s `VariableSizeList` wrapped in `AutoSizer`. `AutoSizer` requires its parent to have a calculable, non-zero height.
- **Finding**:
  - `InventoryTable` calls `PageContainer` without the `scrollable` prop (defaults to `false`).
  - `PageContainer` applies `h-full min-h-0`.
  - For `h-full` to work, the parent element (router outlet / layout) must have a defined height. If the layout chain is broken (e.g., a `div` without `h-full`), the table collapses to 0 height.

### 2. Data Integrity & Parsing

#### History Date Stamp vs Extracted Date
- **Location**: `utils/parsers/DataMapper.ts`
- **Cause**: In `prepareRawData`, the movement date is mapped directly:
  ```typescript
  date: m.data_mov || new Date().toISOString()
  ```
- **Finding**: `SqlParser` extracts the value as a raw string (e.g., "27/10/2023"). The system does NOT parse or normalize this to ISO 8601.
- **Impact**: Graphs and sorting algorithms (which expect ISO strings or sortable dates) fail or behave erratically. If `m.data_mov` is null/undefined during import, it defaults to `new Date().toISOString()` (current timestamp), causing historical data to appear as "today".

#### Import Expiry Date Validation
- **Location**: `utils/parsers/DataMapper.ts`
- **Cause**:
  ```typescript
  expiryDate: lot.validade || ''
  ```
- **Finding**: There is no validation to check if `lot.validade` is a valid date. Garbage data or strings like "Indeterminado" are passed through to the UI, which may try to format them and fail, or cause sorting issues.

#### Item Name Normalization
- **Location**: `utils/stringUtils.ts` -> `sanitizeProductName`
- **Cause**: The normalization relies on a hardcoded dictionary (`PRODUCT_CORRECTIONS`) and Regex replacement.
- **Finding**: It handles specific cases (e.g., "ALCOOL" -> "ÁLCOOL") but lacks a fuzzy matching engine to auto-correct unlisted typos against a known standard catalog during import.

#### CAS Inference
- **Location**: `services/ImportService.ts` -> `enrichInventory`
- **Cause**: CAS inference is a separate post-processing step (`enrichInventory`) that calls `CasApiService`.
- **Finding**: It is not integrated into the main `importBulk` pipeline. If the user imports data and doesn't explicitly run "Enrichment", CAS numbers remain missing.

### 3. Graphs Functionality

#### Charts Not Working
- **Location**: `components/Dashboard.tsx`, `hooks/useDashboardAnalytics.ts`
- **Cause**: Directly downstream of the "History Date" issue.
- **Finding**: The charts group data by date. Since import dates are either "today" (if missing) or "raw strings" (unparseable by `Date` in some browsers), the aggregation logic fails, resulting in empty or flat charts.

### 4. System Design & DTOs

#### DTO Correction
- **Location**: `types.ts`
- **Finding**: The system uses a "Hybrid" model:
  - **V1**: Flat `InventoryItem` (UI-optimized, Denormalized).
  - **V2**: Relational `CatalogProduct`, `InventoryBatch`, `StockBalance` (DB-optimized, Normalized).
- **Issue**: There is friction in keeping these in sync. `DataMapper` is responsible for translating Flat <-> Relational. Any field added to V2 (like `glassVolume`) must be manually mapped to V1 DTOs, or it gets lost in the UI.

#### API Integration
- **Location**: `services/GoogleSheetsService.ts`, `services/CasApiService.ts`
- **Finding**: The system relies heavily on Google Apps Script for backend logic. Errors in the GAS backend (e.g., timeouts) are often masked as generic failures in the frontend.

## Code References

- **`components/InventoryRows.tsx`**: CSS Grid definition causing text cut-off.
- **`components/InventoryTable.tsx`**: `AutoSizer` implementation susceptible to layout collapse.
- **`utils/parsers/DataMapper.ts`**:
  - `prepareRawData`: Missing date parsing logic for `data_mov`.
  - `deriveNormalizedData`: Parsing `lot.validade` without validation.
- **`services/ImportService.ts`**: `importHistoryBulk` logic overriding timestamps.
- **`utils/stringUtils.ts`**: `sanitizeProductName` logic.

## Recommendations (for future implementation plan)

1.  **Refactor Date Parsing**: Implement a robust `parseDate` utility in `DataMapper` to convert SQL dates (DD/MM/YYYY etc.) to ISO 8601.
2.  **Validator**: Add a check in `DataMapper` to ignore `validade` if it's not a valid date.
3.  **UI Layout**:
    - Ensure `PageContainer` parent has height.
    - Update `InventoryRows` to use CSS Grid `minmax` more flexibly or allow text wrapping.
4.  **Integration**: Call `enrichInventory` automatically (or prompt user) after bulk import.
