## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-10-18 - Data Loss via Empty Input Validation (DoS)
**Vulnerability:** The `deleteItem` function in Google Apps Script used `rowBatchId.includes(itemId)` to find items to delete. If `itemId` was an empty string `""`, this condition evaluated to `true` for every row, causing the entire database (Balances sheet) to be soft-deleted.
**Learning:** Functions that perform destructive actions (Delete/Update) must have strict input validation. Never trust that the client will send valid data.
**Prevention:** Add explicit checks for `null`, `undefined`, and empty strings at the beginning of critical functions. Do not rely on loose matching like `.includes()` without verifying the input length/validity first.
