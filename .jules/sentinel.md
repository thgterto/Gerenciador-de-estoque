## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - Formula Injection in Google Sheets
**Vulnerability:** User input was being written directly to Google Sheets without sanitization. If an attacker submitted a string starting with `=`, `+`, `-`, or `@`, it could be interpreted as a formula, potentially leaking data or executing commands.
**Learning:** Spreadsheets are executable environments. Treating them as simple data stores without escaping special characters is a major risk (CSV/Formula Injection).
**Prevention:** Prepend a single quote `'` to any string starting with formula triggers (`=`, `+`, `-`, `@`) to force the spreadsheet to treat it as literal text.
