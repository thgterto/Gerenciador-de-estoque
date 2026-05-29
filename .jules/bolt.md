## 2025-01-20 - [Date Processing Optimization]
**Learning:** `new Date()` parsing is a significant bottleneck when called frequently in loops (like filtering inventory arrays).
**Action:** Use cached ISO strings (`new Date().toISOString().split('T')[0]`) for comparison against `expiryDate` string formats instead of creating Date objects. This pattern is already in use in `utils/businessRules.ts`.

## 2025-01-22 - [Timezone Safety with ISO Strings]
**Learning:** Using `new Date().toISOString()` converts local time to UTC. If a local system is behind UTC (e.g., in the Americas in the late evening), `.toISOString().split('T')[0]` will yield "tomorrow's" date, introducing subtle boundary logic bugs for date comparisons (like expiry checks).
**Action:** When converting local `Date` objects to ISO 8601 strings for local-time date comparisons, explicitly shift the time using `d.getTime() - (d.getTimezoneOffset() * 60000)` before calling `.toISOString()`.
