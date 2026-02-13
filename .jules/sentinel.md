## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-23 - Data Loss via Empty Input (Critical)
**Vulnerability:** The `deleteItem` function in the GAS backend accepted an empty string as `itemId`. Due to the logic `rowBatchId.includes(itemId)`, an empty string matches every record, causing a complete database wipe (DoS/Data Loss).
**Learning:** Functions that perform destructive actions based on string matching (especially partial matching like `includes`) must strictly validate input length and existence. Implicit "truthy" checks are often insufficient.
**Prevention:** Always add explicit input validation for critical parameters. Reject empty strings, nulls, or unexpectedly short inputs before processing destructive operations.
