## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-23 - Critical Logic Vulnerability in Data Deletion
**Vulnerability:** The `deleteItem` function allowed deleting the entire database if the provided `itemId` was an empty string. This was caused by `String.prototype.includes('')` returning `true` for all strings.
**Learning:** Functions that perform destructive actions based on string matching (like `includes`) must rigorously validate inputs to ensure they are not empty, null, or whitespace-only. "Fuzzy matching" logic is inherently risky for deletions.
**Prevention:** Always validate ID inputs (e.g., `if (!id || id.trim() === '') return;`) before performing any write/delete operations. Use strict equality (`===`) whenever possible for critical identifiers.

## 2025-05-23 - Formula Injection (CSV Injection) Prevention
**Vulnerability:** User input fields (like Observations) were written directly to Google Sheets, allowing Formula Injection (CSV Injection) if the input started with `=`, `+`, `-`, or `@`.
**Learning:** Spreadsheets treat any cell starting with these characters as a formula, which can execute code or exfiltrate data.
**Prevention:** Sanitize all user-controlled text fields before writing to a spreadsheet by prepending a single quote (`'`) if the value starts with a dangerous character. This forces the spreadsheet to treat the content as a string.
