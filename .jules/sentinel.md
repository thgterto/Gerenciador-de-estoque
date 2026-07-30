## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - LFI Risk in Electron Window Handler
**Vulnerability:** The Electron `setWindowOpenHandler` was configured to `allow` non-http/https URLs by default (`return { action: 'allow' }`). This could allow `file://` URLs to open a new window if a malicious link was clicked, potentially exposing local files (Local File Inclusion).
**Learning:** Defaulting to `allow` in security handlers is a violation of "Deny by Default". In Electron, `allow` inherits permissions and can open local files if the URL scheme is `file://`.
**Prevention:** Always configure `setWindowOpenHandler` to `deny` by default. Explicitly whitelist protocols (e.g., `https:`, `mailto:`) that should be handled externally via `shell.openExternal`.

## 2025-05-25 - Network Exposure via Default Bind Address
**Vulnerability:** The Fastify server (`server/src/app.ts`) was binding to `0.0.0.0` (all interfaces) by default, exposing the local backend to the entire network. Coupled with a default JWT secret, this created a critical security risk.
**Learning:** Development tools often prioritize convenience (`0.0.0.0`) over security (`127.0.0.1`). When distributed as part of a portable app or local tool, this exposes users to network attacks.
**Prevention:** Always bind servers to `127.0.0.1` by default unless external access is explicitly required and secured. Use environment variables (e.g., `HOST`) to allow configuration for advanced use cases.

## 2026-05-19 - DOM-based XSS via unescaped inputs in print modals
**Vulnerability:** The `document.write()` API was used to create printable HTML labels by interpolating user-controlled variables (like `item.name`, `item.lotNumber`, `item.id`) into a template string without prior sanitization. This introduced a classic DOM-based Cross-Site Scripting (XSS) vulnerability.
**Learning:** Even when opening a "blank" window for printing, any HTML injected into it executes in the origin of the calling window. Using raw string interpolation (`${variable}`) inside an HTML context is fundamentally unsafe if the variable originates from user input.
**Prevention:** Avoid `document.write()`. If you must construct HTML strings dynamically, ALWAYS pass user inputs through a robust HTML encoding function (e.g., escaping `&`, `<`, `>`, `"`, `'`) before interpolation. A better alternative is to use safer DOM APIs like `document.createElement` and `textContent`.
