## 2024-02-12 - Search Performance Optimization
**Learning:** Pre-computing search strings for large lists avoids repeated normalization during filtering.
**Action:** When implementing search filtering in `useMemo`, consider building a search index keyed by item ID if normalization is expensive.
