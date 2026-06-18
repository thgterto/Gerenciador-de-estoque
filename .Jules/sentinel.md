# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.

## 2026-06-18 - Insecure Default Fallback for JWT Secret
**Vulnerability:** The backend application used a predictable, hardcoded string (`supersecret_change_me_in_prod`) as a fallback for the `JWT_SECRET` environment variable in `server/src/config.ts`. If deployed without configuration, an attacker could forge JWT tokens, leading to an authorization bypass.
**Learning:** Hardcoded default secrets are dangerous, especially for portable tools or template code that may be deployed without full configuration. A fallback should either throw an error in production or generate a secure, random secret on startup.
**Prevention:** Always use a randomly generated fallback (e.g., `crypto.randomBytes(32).toString('hex')`) if a configuration variable for a secret is missing, or strictly require it via an environment check to fail securely.
