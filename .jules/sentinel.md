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

## 2025-05-27 - XSS in document.write for Modals
**Vulnerability:** A Cross-Site Scripting (XSS) vulnerability was found in the `handlePrint` function of the Modals component (`src/components/Modals.tsx` and `labcontrol-spfx/src/webparts/labControlApp/components/Modals.tsx`), where user-controlled inputs (`item.name`, `item.lotNumber`, `item.id`) were dynamically injected into a string executed by `document.write`.
**Learning:** Even internal windows created by `window.open` and populated via `document.write` are susceptible to XSS if inputs are not sanitized. In React, while component rendering automatically sanitizes data, raw strings sent to the DOM API bypass this protection. Applying a sanitization function to React props leads to double escaping issues, so escaping should only be applied immediately before native string injection.
**Prevention:** Avoid `document.write` if possible. If required, sanitize variables being injected with an HTML escape function (`<`, `>`, `&`, `"`, `'`) specifically and only right before they are concatenated into the string sent to the native DOM APIs.
## 2025-09-08 - Privilege Escalation in User Registration
**Vulnerability:** The `registerSchema` in the `AuthController` allowed an optional `role` parameter. Because the `/api/auth/register` endpoint is public, a malicious user could pass `{"role": "ADMIN"}` to escalate their privileges during account creation (Mass Assignment).
**Learning:** Exposing domain model fields directly to public API endpoints without filtering allows attackers to manipulate sensitive properties.
**Prevention:** Remove sensitive fields from validation schemas intended for public use, and hardcode or enforce safe defaults on the server side (e.g., explicitly setting `role: 'USER'` when creating a new account).
