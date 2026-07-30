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

## 2025-05-26 - XSS Risk via document.write
**Vulnerability:** The `Modals.tsx` component was using `document.write` to render a new window for printing labels. It injected unsanitized user inputs (`item.name`, `item.lotNumber`, `item.id`) directly into the HTML string, which could lead to Cross-Site Scripting (XSS).
**Learning:** `document.write` is inherently dangerous, especially when combined with unsanitized dynamic data. Even in a seemingly controlled environment like a print window, it's a vector for injection.
**Prevention:** Always sanitize dynamic data before injecting it into HTML strings. A simple HTML escaper function that replaces characters like `<`, `>`, `&`, `"`, and `'` with their corresponding HTML entities can mitigate this risk.

## 2025-05-27 - Hardcoded JWT Secret
**Vulnerability:** The backend configuration (`server/src/config.ts`) used a hardcoded default string (`supersecret_change_me_in_prod`) for the JWT secret if the `JWT_SECRET` environment variable was not set.
**Learning:** Hardcoded default secrets are often overlooked and deployed into production environments. This allows attackers who know or guess the default secret to forge valid JWTs, potentially bypassing authentication entirely.
**Prevention:** If an environment variable is missing, generate a strong, random secret at runtime (e.g., using `crypto.randomBytes`) instead of falling back to a static string. This ensures that even if the configuration is mismanaged, the system remains secure by default.
