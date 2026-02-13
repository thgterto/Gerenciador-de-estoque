## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-10-26 - Implicit Window Access in Electron
**Vulnerability:** `setWindowOpenHandler` was configured to `allow` any URL that wasn't http/https. This implicitly whitelisted `file://` and `javascript:` protocols, creating a risk of local file access or protocol smuggling if an attacker could trigger `window.open`.
**Learning:** Default-deny is crucial in Electron. Whitelisting only external protocols (http/s) leaves internal protocols (file, etc.) exposed to the renderer process.
**Prevention:** Always return `{ action: 'deny' }` by default in `setWindowOpenHandler` and explicitly whitelist only necessary internal popups (like `about:blank` for printing) with strict `webPreferences`.
