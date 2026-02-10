# Debugger Analysis Report

## Overview
This report applies the **4-Phase Debugging Process** to the LabControl codebase to identify root causes of potential instability, resource leaks, and logic errors.

## Phase 1: Reproduce & Isolate (Findings)

The following issues were identified through static code analysis and pattern matching.

### 1. Resource Leak in `SyncQueueService`
- **Symptom**: Potential multiple event listeners attached to `window`, causing memory leaks or multiple handlers firing.
- **Location**: `app/services/SyncQueueService.ts`
- **Evidence**:
  ```typescript
  startAutoSync(intervalMs = 30000) {
      // ...
      window.addEventListener('online', (window as any)._syncOnlineListener);
  }
  // stopAutoSync does NOT remove this listener
  ```
- **Severity**: Medium (Memory Leak)

### 2. Stale Closures in `BatchList`
- **Symptom**: Batch list might not update or might loop if dependencies change.
- **Location**: `app/components/BatchList.tsx`
- **Evidence**: `useEffect` depends on `itemId` but calls `load`, which is defined outside the effect and not listed in dependencies.
- **Severity**: Low (Functional Stability)

### 3. Race Condition Risk in `useECharts`
- **Symptom**: Charts may fail to render if the DOM ref is not ready when the effect runs.
- **Location**: `app/hooks/useECharts.ts`
- **Evidence**: `useEffect` has empty dependency array `[]` but uses `chartRef.current`.
- **Severity**: Medium (UI Glitch)

### 4. Performance Bottleneck in `useInventoryData`
- **Symptom**: Application lag during high-frequency updates (e.g., bulk imports).
- **Location**: `app/hooks/useInventoryData.ts`
- **Evidence**:
  ```typescript
  const unsubscribe = db.subscribe(() => {
      if (isMounted.current) loadData(false); // Calls getAllItems() -> Full Table Scan
  });
  ```
- **Severity**: High (Scalability)

## Phase 2: Root Cause Analysis (5 Whys)

### Issue: SyncQueueService Leak
1.  **Why?** `startAutoSync` attaches an event listener.
2.  **Why is it a leak?** `stopAutoSync` clears the interval but forgets `removeEventListener`.
3.  **Why?** Incomplete implementation of the cleanup logic.
4.  **Root Cause**: Violation of "Resource Acquisition Is Initialization" (RAII) pattern; cleanup must mirror setup.

### Issue: Performance in useInventoryData
1.  **Why?** The app loads all data on every change.
2.  **Why?** The `HybridStorageManager` notification is generic (no specific ID changed).
3.  **Why?** `db.subscribe` triggers on *any* write to the watched tables.
4.  **Root Cause**: Coarse-grained reactivity. The application re-reads the entire database (O(N)) for every single write operation, which is O(N^2) during bulk updates if not throttled correctly.

## Phase 3: Fix Recommendations

### 1. Fix `SyncQueueService` Leak
**Action**: Add `removeEventListener` in `stopAutoSync`.

```typescript
stopAutoSync() {
    if (this._intervalId) {
        window.clearInterval(this._intervalId);
        this._intervalId = null;
    }
    if ((window as any)._syncOnlineListener) {
        window.removeEventListener('online', (window as any)._syncOnlineListener);
        delete (window as any)._syncOnlineListener;
    }
}
```

### 2. Fix `BatchList` Dependencies
**Action**: Move `load` function inside `useEffect` or wrap in `useCallback`.

### 3. Optimize `useInventoryData`
**Action**:
- Implement pagination or virtualized windowing at the Service level (requires major refactor).
- **Quick Fix**: Debounce the `loadData` call inside the subscription even more aggressively, or only reload relevant parts.

## Conclusion
The codebase is generally functional but exhibits "technical debt" patterns that will cause scaling issues (Performance) and reliability issues (Leaks) if not addressed. The most critical immediate fix is the **Event Listener Leak**.
