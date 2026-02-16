## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - Data Loss via Empty Input
**Vulnerability:** The Google Apps Script backend function `deleteItem` used `rowBatchId.includes(itemId)` for deletion logic. An empty string input (`itemId = ""`) matches every row (`"string".includes("") === true`), causing the entire inventory to be deleted (DoS/Data Loss).
**Learning:** Using partial matching (`includes`, `contains`, `LIKE`) on identifiers for destructive actions is extremely risky. Input validation for empty strings is critical for any API endpoint.
**Prevention:** Always validate that required parameters (especially IDs) are present and non-empty. Prefer strict equality (`===`) over partial matching for deletions unless absolutely necessary and heavily guarded.
