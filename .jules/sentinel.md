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
## 2025-05-26 - Hardcoded JWT Secret Removed
**Vulnerability:** The Fastify server (`server/src/config.ts`) used a hardcoded fallback for `JWT_SECRET` (`'supersecret_change_me_in_prod'`).
**Learning:** Hardcoded default secrets allow attackers to forge authentication tokens if the secret is not overridden in production environments, presenting a critical security risk.
**Prevention:** If an environment variable for a secret is not provided, either fail securely (throw an error and prevent startup) or automatically generate a cryptographically secure random string on startup so the secret remains unknown.
## 2023-10-25 - Fixed Authorization Bypass and Error Information Leak
**Vulnerability:** The `/api/inventory` endpoint was missing JWT authentication, allowing unauthenticated users to access sensitive inventory data. Also, the `InventoryController` leaked `error.message` directly in 500 responses instead of using the global error handler.
**Learning:** In fastify, defining an endpoint without an `onRequest` auth hook leaves it publicly accessible, which can easily happen if routes are manually grouped by comments. Manually sending 500 responses in catch blocks circumvents global error handling that is meant to sanitize outputs.
**Prevention:** Always verify that sensitive endpoints have an auth hook applied. Use global error handlers instead of manual try-catch 500 responses to avoid leaking stack traces or internal messages.
