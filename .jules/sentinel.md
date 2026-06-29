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

## 2024-05-27 - Cross-Site Scripting (XSS) in Modals via document.write
**Vulnerability:** Found a Cross-Site Scripting (XSS) vulnerability in `src/components/Modals.tsx` where user-controlled input (`item.name`, `item.lotNumber`, `item.expiryDate`, `item.id`) is unescaped and injected directly into `printWindow.document.write()`.
**Learning:** React escapes input when rendering via JSX, but manual DOM manipulation or string building (like `document.write` or `innerHTML`) bypasses this protection, leading to XSS if inputs contain HTML/JS. Moreover, simply returning `String(unsafe)` without escaping when input is not a string leaves the vulnerability open if the payload is passed in arrays or objects.
**Prevention:** Avoid `document.write`. When generating dynamic HTML as a string, manually sanitize/escape user inputs or use safer browser APIs instead of directly interpolating variables. Ensure the escape function reliably stringifies and sanitizes all input types.
