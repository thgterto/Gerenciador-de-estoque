1. **Optimize Date Sorting**: Replace `new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()` with string comparison `a.expiryDate < b.expiryDate ? -1 : (a.expiryDate > b.expiryDate ? 1 : 0)` in `src/services/InventoryService.ts` to improve sorting performance for ISO date strings, as noted in `.jules/bolt.md`.
2. **Pre-commit Checks**: Run pre-commit checks to ensure everything works correctly.
3. **Submit**: Create PR.
