## 2025-02-14 - Date Handling Inconsistency
**Learning:** Discovered inconsistent date logic where filtering checked expiry at 'Start of Day' (UTC) while rendering checked at 'End of Day' (Valid Today). This caused items to appear "Expired" in filters but "OK" in the list.
**Action:** When optimizing date logic, always verify that the optimized path (e.g., string comparison) aligns with the business logic of the slow path, or document the intentional behavior change.
