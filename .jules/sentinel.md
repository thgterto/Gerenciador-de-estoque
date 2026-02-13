## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-23 - CSV/Formula Injection
**Vulnerability:** User input starting with `=`, `+`, `-`, or `@` was written directly to the Google Sheet backend, potentially allowing formula execution.
**Learning:** Google Apps Script's `setValues` interprets strings starting with these characters as formulas by default, even when using API-like methods.
**Prevention:** Prepend a single quote `'` to any cell value starting with dangerous characters to force string literal interpretation.
