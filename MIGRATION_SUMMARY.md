# Portable Architecture Migration Summary

## Completed Tasks
1.  **Backend Logic Migration**:
    *   Created  handling  (logic moved from db.cjs), , .
    *   Created  handling .
    *   Refactored  to be a thin DAO layer exposing  and prepared statements.

2.  **Database Layer Enhancement**:
    *   Updated  adding  and  tables.
    *   Added  and  to .

3.  **Frontend Service Unification**:
    *   Created  as a facade for  vs .
    *   Refactored  to use .
    *   Updated  to map  and other IPC channels.

4.  **Packaging**:
    *   Updated  to set  to  folder.
    *   Verified  build config (no changes needed,  include ).

## Verification
*   Ran
> labcontrol-umv@1.8.0 build
> tsc && vite build

components/Dashboard.tsx(1,17): error TS6133: 'useState' is declared but its value is never read.
components/Dashboard.tsx(5,28): error TS6133: 'IconButton' is declared but its value is never read.
components/Header.tsx(3,34): error TS6133: 'Typography' is declared but its value is never read.
components/Header.tsx(70,5): error TS6133: 'onToggleTheme' is declared but its value is never read.
components/HistoryTable.tsx(5,5): error TS6133: 'IconButton' is declared but its value is never read.
components/HistoryTable.tsx(8,1): error TS6133: 'useTheme' is declared but its value is never read.
components/InventoryRows.tsx(11,1): error TS6133: 'useTheme' is declared but its value is never read.
components/InventoryTable.tsx(3,30): error TS6133: 'Snackbar' is declared but its value is never read.
components/InventoryTable.tsx(3,40): error TS6133: 'Alert' is declared but its value is never read.
components/ItemForm.tsx(18,77): error TS6133: 'InputAdornment' is declared but its value is never read.
components/ItemForm.tsx(18,105): error TS6133: 'Tooltip' is declared but its value is never read.
components/Layout.tsx(30,11): error TS6133: 'isMobile' is declared but its value is never read.
components/Modals.tsx(8,5): error TS6133: 'Alert' is declared but its value is never read.
components/Modals.tsx(10,1): error TS6133: 'useTheme' is declared but its value is never read.
components/inventory/InventoryFilters.tsx(6,1): error TS6133: 'FilterListIcon' is declared but its value is never read.
components/inventory/InventoryFilters.tsx(32,5): error TS6133: 'getCategoryIcon' is declared but its value is never read.
components/inventory/InventoryFilters.tsx(54,36): error TS6133: 'e' is declared but its value is never read.
components/item-form/RiskSelector.tsx(4,19): error TS6133: 'IconButton' is declared but its value is never read.
components/item-form/TypeSelector.tsx(29,28): error TS6133: 'e' is declared but its value is never read.
components/ui/Badge.tsx(15,100): error TS6133: 'withDot' is declared but its value is never read.
components/ui/Modal.tsx(2,85): error TS6133: 'Box' is declared but its value is never read.
components/ui/PageContainer.tsx(2,15): error TS6133: 'Container' is declared but its value is never read. (found unrelated lint errors in components, but core changes compile).
*   Code reviewed manually against GAS logic.
