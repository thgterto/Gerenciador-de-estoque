
## 2024-05-24 - Array Flat List Iteration
**Learning:** `getItemStatus(i, now)` passed with explicit `now` bypasses the fast string comparison path I just discovered in `utils/businessRules.ts`. The explicit check does `new Date(item.expiryDate) < now`, which is slower than string comparison.
**Action:** Let's omit the `now` parameter to `getItemStatus` in `useInventoryFilters.ts` so it leverages `getTodayISO()` for string comparison. This is a solid performance win for large arrays. Wait, in `businessRules.ts`, if `now` is provided, it does a `new Date()` comparison. If `now` is omitted, it uses string comparison. So omitting it in `useInventoryFilters.ts` is faster.

