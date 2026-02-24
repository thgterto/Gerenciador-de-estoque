## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - LFI Risk in Electron Window Handler
**Vulnerability:** The Electron `setWindowOpenHandler` was configured to `allow` non-http/https URLs by default (`return { action: 'allow' }`). This could allow `file://` URLs to open a new window if a malicious link was clicked, potentially exposing local files (Local File Inclusion).
**Learning:** Defaulting to `allow` in security handlers is a violation of "Deny by Default". In Electron, `allow` inherits permissions and can open local files if the URL scheme is `file://`.
**Prevention:** Always configure `setWindowOpenHandler` to `deny` by default. Explicitly whitelist protocols (e.g., `https:`, `mailto:`) that should be handled externally via `shell.openExternal`.

## 2025-05-25 - Network Exposure in Portable Backend
**Vulnerability:** The portable backend server (`server/src/app.ts`) was binding to `0.0.0.0` by default, exposing the API and potentially sensitive inventory data to the entire local network (e.g., public Wi-Fi).
**Learning:** Defaulting to `0.0.0.0` is common for Dockerized apps but insecure for desktop/portable apps intended for single-user scenarios. It violates the "Principle of Least Privilege" regarding network access.
**Prevention:** Always bind to `127.0.0.1` (localhost) for local-only tools unless network access is explicitly required and secured.
