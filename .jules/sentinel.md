## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - Data Loss via Empty Input
**Vulnerability:** The `deleteItem` function in `backend/GoogleAppsScript.js` used `includes()` for ID matching (`rowBatchId.includes(itemId)`). If `itemId` was an empty string, this condition evaluated to true for every record, causing a full database wipe.
**Learning:** Loose matching logic (like `includes` without strict length/content checks) combined with missing input validation is a recipe for disaster, especially in bulk operations.
**Prevention:** Always validate inputs for critical operations (delete/update). Ensure identifiers are non-empty and conform to expected formats before processing.
