## 2024-05-15 - React Hook Textual Filtering
**Learning:** Using `WeakMap` inside a custom hook cache is highly effective for textual search performance in React. Since React enforces immutability, updated items receive new references, acting as a natural, safe cache invalidator. This prevents the need to calculate normalized search strings per keystroke across thousands of items.
**Action:** Use `WeakMap` instead of re-calculating expensive string operations inside `useMemo` blocks when filtering large arrays of objects, especially when the objects themselves act as the invalidation key.
