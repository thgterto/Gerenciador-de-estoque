# Report on Broken/Risky Components

## Overview
This report identifies components that are flagged with lint warnings which may indicate functional issues or "broken" behavior, despite the build passing successfully.

## Build Status
- **Build**: `npm run build` passes successfully.
- **Critical Bugs**: The critical runtime bugs mentioned in previous reports (regarding `InventoryService` usage of `HybridTableWrapper`) have been verified as **fixed**.

## Identified Components with Functional Risks

The following components have React Hook warnings (missing dependencies) which can lead to stale closures, infinite loops, or failure to update UI correctly.

### 1. `app/components/BatchList.tsx`
- **Issue**: `useEffect` has a missing dependency: `'load'`.
- **Risk**: The `load` function is defined outside the `useEffect` and depends on state/props. Omitting it from the dependency array means the effect might use a stale version of `load` or fail to re-run when dependencies of `load` change.
- **Recommendation**: Move the `load` function definition *inside* the `useEffect` hook to capture dependencies correctly and ensure it's always fresh.

### 2. `app/hooks/useECharts.ts`
- **Issue**: `useEffect` has a missing dependency: `'chartRef'`.
- **Risk**: If the `chartRef` (MutableRefObject) changes (which is rare but possible if the parent component re-renders in a specific way or if conditional rendering is involved), the chart initialization logic might not run or might run on a stale ref.
- **Recommendation**: Include `chartRef` in the dependency array. Since it is a ref, it is stable, but including it satisfies the linter and ensures correctness if strict mode is enabled.

## General Code Quality Issues
There are approximately **170 lint warnings** in the codebase. Most are related to:
- Usage of `any` type (`@typescript-eslint/no-explicit-any`).
- Unused variables (`@typescript-eslint/no-unused-vars`).

While these do not prevent the application from running, they reduce type safety and code cleanliness.
