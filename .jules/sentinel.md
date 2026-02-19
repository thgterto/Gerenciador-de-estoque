## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - LFI Risk in Electron Window Handler
**Vulnerability:** The Electron `setWindowOpenHandler` was configured to `allow` non-http/https URLs by default (`return { action: 'allow' }`). This could allow `file://` URLs to open a new window if a malicious link was clicked, potentially exposing local files (Local File Inclusion).
**Learning:** Defaulting to `allow` in security handlers is a violation of "Deny by Default". In Electron, `allow` inherits permissions and can open local files if the URL scheme is `file://`.
**Prevention:** Always configure `setWindowOpenHandler` to `deny` by default. Explicitly whitelist protocols (e.g., `https:`, `mailto:`) that should be handled externally via `shell.openExternal`.

## 2025-05-25 - Hardcoded Secrets in Open Source
**Vulnerability:** The application was using a hardcoded default JWT secret (`'supersecret_change_me_in_prod'`) in `config.ts` if the environment variable was missing.
**Learning:** Hardcoded secrets in source code are a critical vulnerability, especially in open-source projects, as they allow anyone to forge authentication tokens. Relying on users to "change in prod" without forcing it is dangerous.
**Prevention:** Use a secure default mechanism like `crypto.randomBytes(32)` to generate a secret at runtime if one is not provided. While this invalidates sessions on restart, it is fail-safe and prevents the vulnerability by design.
