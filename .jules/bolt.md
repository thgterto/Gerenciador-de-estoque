## 2024-06-25 - [Removed Native Pagination with Virtualization in Inventory List]
**Learning:** `react-window` and `react-virtualized-auto-sizer` are already installed dependencies in this project. Using them for virtualization over arbitrary list pagination leads to significant performance boosts on long lists without needing new dependencies. Cleaned up scratch files to prevent pollution.
**Action:** Always clean up temporary files in root, and explicitly verify dependencies already exist before using them to prevent reviewer concerns.
