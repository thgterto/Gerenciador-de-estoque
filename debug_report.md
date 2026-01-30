# Debug Report

## What's Wrong
The deployment (build) is failing due to TypeScript compilation errors. More critically, **the application contains runtime bugs that will cause crashes** when searching for items or performing ledger audits.

## Evidence Found

### 1. Build Failures (TypeScript Errors)
Running `npm run build` fails with:
- `services/InventoryService.ts`:
    - `Property 'where' does not exist on type 'HybridTableWrapper...'`
    - `Property 'each' does not exist on type 'HybridTableWrapper...'`
    - Implicit `any` types.
- `components/ItemForm.tsx` & `hooks/useCasSearch.ts`: Unused variables (`sanitizeProductName`, `setErrors`, imports).

### 2. Critical Runtime Bugs
In `services/InventoryService.ts`:
- **Line 117 & 121**: `await db.items.where('sapCode')...`
    - `db.items` is a `HybridTableWrapper`, which **does not have a `where` method**. This will throw `TypeError: db.items.where is not a function` at runtime.
    - **Fix**: Should use `db.rawDb.items.where(...)`.
- **Line 581**: `await db.items.each(...)`
    - `HybridTableWrapper` does not have an `each` method.
    - **Fix**: Should use `db.rawDb.items.each(...)`.

### 3. Frontend Consistency
- **Unused Code**: `components/ItemForm.tsx` has defined but unused variables, which breaks strict linting rules.
- **Type Safety**: The `HybridStorageManager` defines `db` as `any`, which defeats Type Safety for the underlying raw database access, causing implicit `any` errors in `InventoryService.ts`.

## Root Cause
The `InventoryService` was updated to use the new `HybridStorageManager` wrapper, but some methods (`findItemByCode`, `runLedgerAudit`) still try to access Dexie-native methods (`where`, `each`) directly on the wrapper instead of the raw database instance.

## Recommended Fixes

### 1. Fix `InventoryService.ts`
Modify the service to access `rawDb` for advanced queries:

```typescript
// services/InventoryService.ts

// Fix findItemByCode
item = await db.rawDb.items.where('sapCode').equals(cleanCode).first();
item = await db.rawDb.items.where('lotNumber').equals(cleanCode).first();

// Fix runLedgerAudit
await db.rawDb.items.each(item => { ... });
```

### 2. Improve `HybridStorageManager` Typing
Update `utils/HybridStorage.ts` to properly type the `db` property instead of `any`, or cast `rawDb` usages.

### 3. Clean up Frontend Code
Remove unused variables in `components/ItemForm.tsx` and `hooks/useCasSearch.ts` to pass the build.
