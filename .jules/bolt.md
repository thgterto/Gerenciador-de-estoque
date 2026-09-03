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

## 2025-02-14 - Documentation Strategy
**Learning:** Documenting performance optimizations in a dedicated  file helps maintain awareness of high-impact patterns and prevents regressions during future refactors.
**Action:** Maintain a living performance document alongside the codebase.

## 2025-02-14 - Documentation Strategy
**Learning:** Documenting performance optimizations in a dedicated `docs/PERFORMANCE.md` file helps maintain awareness of high-impact patterns and prevents regressions during future refactors.
**Action:** Maintain a living performance document alongside the codebase.

## 2025-02-14 - Unmemoized Hook Functions & Virtual List Performance
**Learning:** Functions returned from custom hooks (like `toggleGroupExpand` in `useInventoryFilters`) that are recreated on every render will invalidate `itemData` prop passed to `react-window` components, forcing the entire list to re-render even if the underlying data (`flatList`) is stable.
**Action:** Always wrap functions returned from hooks in `useCallback` if they are passed down to memoized children or used in `useMemo` dependencies, especially when filtering/sorting logic is involved.

## 2025-02-14 - Internal Caching Bypass via Optional Arguments
**Learning:** Passing optional override arguments (like passing `now` to `getItemStatus`) can inadvertently bypass internal caching mechanisms within utility functions. In this codebase, `getItemStatus(item, now)` forced explicit Date object parsing instead of using the cached `todayISO` string comparison, leading to significant performance degradation during array iterations.
**Action:** When iterating over large datasets, prefer calling utility functions without optional overrides if those overrides bypass internal optimizations.

## 2025-02-14 - Naive ISO String Date Comparison Pitfall
**Learning:** Naively converting `new Date()` to ISO strings using `.toISOString().split('T')[0]` generates UTC strings. This can lead to bugs where events late in the day in local timeframes (e.g. UTC-3) appear to have shifted to "tomorrow". Furthermore, string comparison between full ISO timestamps (e.g., "2023-11-04T12:00:00Z") and date-only prefixes (e.g., "2023-11-04") behaves incorrectly compared to numerical Date timestamp logic.
**Action:** Always parse dates into explicit numeric timestamps (`new Date().getTime()`) when comparing mixed-format ISO date boundaries or calculating offsets, ensuring timezone correctness rather than attempting naive string truncation for performance.
