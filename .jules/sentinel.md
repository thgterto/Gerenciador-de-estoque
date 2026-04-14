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

## 2025-04-14 - Fix Privilege Escalation Vulnerability in Registration
**Vulnerability:** A critical mass assignment vulnerability in the `/api/auth/register` API endpoint allowed any public user to register an account with `ADMIN` privileges by submitting `{"username": "attacker", "password": "...", "role": "ADMIN"}` in the request body.
**Learning:** The registration schema blindly accepted and passed the `role` field from user input directly into the `RegisterUser` use case, bypassing any authorization constraints. This is a textbook example of Mass Assignment (API3: Property Auth) leading to Broken Access Control (A01).
**Prevention:** Never map user input directly to sensitive fields like roles, permissions, or system flags. Ensure the public registration endpoint strips out these fields and explicitly sets a default `USER` role. Sensitive fields should only be modifiable by authorized users via dedicated administrative endpoints.
