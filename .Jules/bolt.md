## 2025-02-28 - [Performance Focus]
**Learning:** React virtualization (react-window) and virtualization helper (react-virtualized-auto-sizer) packages were found in `package.json`, but not actively used in the codebase.
**Action:** Virtualize long lists using `react-window` since the packages are already present and provide massive performance gains for large lists. The main target for this optimization will be `InventoryList.tsx`.
