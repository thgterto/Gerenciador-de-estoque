## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - Formula Injection in Google Sheets
**Vulnerability:** User input written directly to Google Sheets was vulnerable to CSV/Formula Injection. Inputs starting with `=`, `@`, `+`, `-` could execute arbitrary formulas.
**Learning:** Google Apps Script `setValues()` treats cell content as raw values. If the value starts with a formula indicator, it is executed.
**Prevention:** Sanitize all string inputs destined for spreadsheets by prepending a single quote `'` if they start with formula triggers. This forces the cell to be treated as text.
