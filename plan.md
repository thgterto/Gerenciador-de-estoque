1. **Goal**: Optimize the rendering of the `HistoryTable` component which currently displays a list of movement records using a manual pagination approach (`setVisibleCount` to show +50 records at a time). This approach degrades performance when a user views many records because the DOM grows very large.
2. **Strategy**: Implement list virtualization using `react-window` (`FixedSizeList` or `VariableSizeList`) and `react-virtualized-auto-sizer` to only render the visible rows. This significantly reduces memory usage and DOM node count, which is a key performance bottleneck for large lists in React.
3. **Changes in `src/components/HistoryTable.tsx`**:
    - Import `FixedSizeList` from `react-window` and `AutoSizer` from `react-virtualized-auto-sizer`.
    - Note: The application might already have `react-window` and `react-virtualized-auto-sizer` based on previous commands. If not, they have been installed using `npm install`.
    - Modify `HistoryRow` and `HistoryMobileRow` to accept the `style` prop, which is injected by `react-window` for positioning the virtualized rows.
    - Add `React.memo` to the row components to prevent re-rendering them unnecessarily when they enter/leave the viewport. Note: As per `.jules/bolt.md`, we must use `areEqual` to avoid re-rendering `react-window` items if the item data is stable. For `HistoryTable`, the items are mostly static, but we'll structure it correctly.
    - Rewrite `NativeHistoryList` to use `AutoSizer` and `FixedSizeList`. For desktop (`isMobile === false`), the row height is `56px` (`h-[56px]`). For mobile (`isMobile === true`), the row height is not explicitly fixed but depends on content. We can either estimate a fixed height for mobile (e.g., 100px) or use `VariableSizeList`. A fixed height with `FixedSizeList` is much more performant. Looking at `HistoryMobileRow`, it has standard text content that should fit in ~100px.
4. **Implementation details**:
    ```tsx
    import { FixedSizeList as List } from 'react-window';
    import AutoSizer from 'react-virtualized-auto-sizer';
    import { memo } from 'react';
    ```
    - Update the row components:
      ```tsx
      const HistoryRow = memo(({ data, index, style }: any) => {
          const { filtered } = data;
          const item = filtered[index];
          // ... rest of the code ...
          return <div style={style} className="w-full"> ... </div>;
      });
      ```
    - Replace the mapping inside `NativeHistoryList` with `AutoSizer` and `List`.
5. **Verify**: Ensure the application builds properly without TypeScript errors, and run tests if any.
6. **Pre-commit**: Complete `pre_commit_instructions` as required by `.agent/skills`.
