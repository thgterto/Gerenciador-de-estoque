
## 2025-02-28 - Added React.memo optimization to History rows\n**Learning:** Components inside a list rendered using Array.map often rerender unnecessarily when the parent's `visibleCount` increases via "Load More".\n**Action:** Use `React.memo()` for list item components when optimizing list rendering.
