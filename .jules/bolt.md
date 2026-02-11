## 2024-05-22 - Locale Comparison Bottleneck
**Learning:** `String.prototype.localeCompare` was found to be ~2x slower than `Intl.Collator.prototype.compare` (reused instance) for Portuguese strings in this environment. This caused significant main-thread blocking during sorting of large lists (10k+ items).
**Action:** Always prefer a shared `Intl.Collator` instance for repeated string comparisons, especially in `useMemo` hooks or render loops.

## 2025-02-14 - React Window Item Data Re-render
**Learning:** `react-window` components trigger a re-render of ALL row components when the `itemData` prop changes reference, even if wrapped in `React.memo`, unless a custom `arePropsEqual` function is provided. In this app, frequent updates to `selectedIds` caused massive re-renders of the virtualized list.
**Action:** When passing dynamic data via `itemData` (especially selection state), always implement a custom `arePropsEqual` function for the row component to deeply check only relevant props (e.g. `selectedIds.has(id)`) and prevent O(N) re-renders.

## 2025-02-14 - Date Sorting Optimization
**Learning:** Sorting arrays of objects by date using `new Date(b.date).getTime() - new Date(a.date).getTime()` is significantly slower (~10-15x) than string comparison `b.date > a.date ? 1 : -1` for ISO date strings, due to the overhead of creating Date objects.
**Action:** For ISO 8601 date strings, always use lexicographical string comparison instead of parsing to Date objects for sorting.

## 2025-02-14 - IndexedDB Range Queries
**Learning:** Loading entire collections into memory then filtering with JavaScript (e.g. `collection.toArray().filter()`) is inefficient for large datasets.
**Action:** Always prefer Dexie's `where().aboveOrEqual()` or `between()` to leverage IndexedDB indices, significantly reducing the amount of data transferred from IDB to JS memory.
