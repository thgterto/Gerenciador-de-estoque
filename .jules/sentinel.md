## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - Weak Window Security Configuration
**Vulnerability:** The `setWindowOpenHandler` in Electron was returning `action: 'allow'` by default for all non-http/https URLs. This implicitly allowed opening `file://`, `javascript:`, and other dangerous protocols in new windows, potentially exposing local files or enabling protocol smuggling.
**Learning:** Default-allow policies are dangerous in Electron. Even with `nodeIntegration: false`, allowing arbitrary window creation with inherited or default preferences can lead to unexpected security gaps.
**Prevention:** Always use a default-deny policy in `setWindowOpenHandler`. Explicitly whitelist only the protocols and URLs that are strictly necessary (e.g., `about:blank` for printing, external browsers for links).
