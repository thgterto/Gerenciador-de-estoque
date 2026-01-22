## 2024-05-22 - Locale Comparison Bottleneck
**Learning:** `String.prototype.localeCompare` was found to be ~2x slower than `Intl.Collator.prototype.compare` (reused instance) for Portuguese strings in this environment. This caused significant main-thread blocking during sorting of large lists (10k+ items).
**Action:** Always prefer a shared `Intl.Collator` instance for repeated string comparisons, especially in `useMemo` hooks or render loops.
