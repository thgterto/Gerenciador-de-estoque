1. **Analyze Performance Bottleneck**: The codebase contains multiple instances of `new Date().getTime()` being used in `.sort()`, `.filter()`, and `.map()` operations, particularly for calculating days until expiry. According to the developer journal `.jules/bolt.md`, sorting by `new Date(a.date).getTime() - new Date(b.date).getTime()` is significantly slower than string comparison `a.date > b.date ? 1 : -1` for ISO date strings, and creating Date objects in loops is a known performance anti-pattern. We can optimize calculating days by reusing `Date.now()`.

2. **Refactor Expiry Day Calculation**: Create an optimized function `calculateDaysToExpiry(expiryDate: string, nowTime: number = Date.now())` in `src/utils/formatters.ts` or `src/utils/businessRules.ts`. This will allow `nowTime` to be computed once outside of loops/maps and passed in, reducing `new Date().getTime()` calls from O(N) to O(1) in the parent scope.
Also, it looks like `getTodayISO()` is cached in `src/utils/businessRules.ts`.

3. **Apply String Comparison for Date Sorting**: In `src/services/InventoryService.ts:129`, replace `return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();` with string comparison `return a.expiryDate.localeCompare(b.expiryDate);` or standard string `<` / `>` operators.

4. **Apply Days-to-Expiry Optimization**:
   - `src/components/Reports.tsx:379`
   - `src/components/Purchases.tsx:48`
   - `src/components/Purchases.tsx:94`
   - `src/components/PurchaseAlertCard.tsx:28`
   - `src/components/BatchList.tsx:81`
   Update these to pre-calculate `nowTime = Date.now()` where possible, and use the optimized calculation.

5. **Create Pre-Commit Checks**: Run tests and linting.

6. **Submit PR**: Format PR title and description as required by the system prompt.
