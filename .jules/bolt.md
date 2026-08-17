## 2023-10-24 - [Avoid Passing Sets to Memoized Components]
**Learning:** Passing object references (like `Set`) that frequently change (e.g., on every selection click) to `React.memo` wrapped components defeats the purpose of memoization. In `InventoryList.tsx`, passing the `selectedIds` `Set` to `InventoryGroupRow` caused all group rows to re-render whenever *any* single item was selected or unselected.
**Action:** Compute primitive values (`allSelected`, `someSelected` booleans) in the parent component and pass those to memoized child components instead of the entire collection or Set, ensuring O(1) instead of O(N) re-renders upon selection changes.

## 2023-10-24 - Avoid Passing Sets to Memoized Components
**Learning:** Passing object references (like `Set`) that frequently change (e.g., on every selection click) to `React.memo` wrapped components defeats the purpose of memoization. In `InventoryList.tsx`, passing the `selectedIds` `Set` to `InventoryGroupRow` caused all group rows to re-render whenever *any* single item was selected or unselected.
**Action:** Compute primitive values (`allSelected`, `someSelected` booleans) in the parent component and pass those to memoized child components instead of the entire collection or Set, ensuring O(1) instead of O(N) re-renders upon selection changes.
