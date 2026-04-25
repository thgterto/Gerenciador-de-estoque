# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.

## 2026-04-25 - Hardcoded JWT Secret Removed
**Vulnerability:** The server `config.ts` had a hardcoded default JWT secret (`'supersecret_change_me_in_prod'`).
**Learning:** Hardcoded fallback values for cryptographic secrets present a critical vulnerability in source code, especially if an environment variable isn't correctly populated, making tokens easily forged. Replacing it with a random generated secret at runtime can break session persistence across restarts and scales.
**Prevention:** Always enforce that the environment variable `JWT_SECRET` exists (or any critical cryptographic material) by checking it on application startup and exiting with a clear error message `process.exit(1)` if missing.
