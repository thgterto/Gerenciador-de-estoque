
## 2023-10-27 - [Optimize useReportsAnalytics.ts loops]
**Learning:** Found and fixed an O(N*M) nested filtering bottleneck inside the `useReportsAnalytics.ts` hook when calculating the controlled items report. We also eliminated a redundant `.reduce` by shifting the calculation inside a `.map` iteration.
**Action:** When filtering or joining arrays inside `useMemo` hooks, always use a `Map` structure for pre-aggregation (bringing time complexity to O(N + M)) rather than nesting `.filter()` or `.find()` loops. Avoid separate `.reduce` operations if the accumulator can be computed during a prior mapping step.
