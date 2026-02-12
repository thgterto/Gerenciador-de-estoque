## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - Formula Injection in Google Apps Script
**Vulnerability:** The Google Apps Script backend was accepting user input and writing it directly to Google Sheets using `setValues()`. If a user input started with `=`, `+`, `-`, or `@`, Google Sheets would interpret it as a formula, leading to potential CSV Injection / Formula Injection risks.
**Learning:** Even "database-like" usage of spreadsheets is susceptible to formula injection. Always sanitize inputs destined for spreadsheet cells.
**Prevention:** Implemented `sanitizeSheetValue` to prepend a single quote `'` to dangerous strings, forcing Google Sheets to treat them as text.
