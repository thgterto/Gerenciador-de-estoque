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

## 2025-05-26 - Hardcoded JWT Secret Vulnerability
**Vulnerability:** The Fastify server (`server/src/config.ts`) was using a hardcoded fallback JWT secret (`'supersecret_change_me_in_prod'`) if the `JWT_SECRET` environment variable was not set.
**Learning:** Hardcoded fallback secrets are incredibly dangerous. If a user deploys the application and forgets to set the `JWT_SECRET` environment variable, an attacker can simply read the codebase (which is open or accessible), find the fallback secret, and use it to forge arbitrary, valid JSON Web Tokens (JWTs). This completely compromises the application's authentication and authorization systems.
**Prevention:** Instead of a hardcoded string, use a cryptographically secure randomly generated value (e.g., `crypto.randomBytes(32).toString('hex')`) as the fallback secret. This ensures that even if the secret is not explicitly configured, it cannot be guessed. The trade-off is that all active sessions will be invalidated on server restart if a persistent secret isn't configured, but this is a much safer default than allowing global spoofing.
