## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - Logic Vulnerability in Soft Delete
**Vulnerability:** The `deleteItem` function in Google Apps Script allowed deleting ALL records if an empty string ID was provided, due to `String.prototype.includes('')` always returning true.
**Learning:** Logic that relies on partial string matching (like `includes`) without strict input validation can lead to catastrophic data loss. Empty inputs are edge cases that must be explicitly handled.
**Prevention:** Always validate input length and type before performing destructive operations. Use exact equality checks (`===`) where possible, or add guard clauses for empty inputs.

## 2025-05-24 - CSV Injection (Formula Injection)
**Vulnerability:** User input was written directly to Google Sheets cells without sanitization. Malicious formulas (starting with `=`) could be executed when an admin views the sheet.
**Learning:** Spreadsheets (Excel, Google Sheets) treat cell content starting with `=`, `+`, `-`, or `@` as executable formulas. This is a vector for data exfiltration or local command execution (in Excel).
**Prevention:** Prepend a single quote `'` to any user input that starts with these characters to force the spreadsheet to treat it as text.
