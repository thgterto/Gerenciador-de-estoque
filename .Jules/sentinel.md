# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.

## 2024-03-22 - Hardcoded JWT Secret and Public API Endpoint
**Vulnerability:** A hardcoded default JWT secret was used in the backend configuration (`supersecret_change_me_in_prod`). Additionally, the main `/api/inventory` endpoint was publicly accessible.
**Learning:** Default configuration values are often left unchanged in production deployments. Using fallback strings instead of securely generated random keys for cryptography creates a severe vulnerability where an attacker can forge tokens. API endpoints must be explicitly protected.
**Prevention:** Always use securely generated random strings (e.g., `crypto.randomBytes`) as fallback for cryptography secrets if environment variables are not provided, or fail the startup process explicitly. Apply authentication middleware systematically to all relevant endpoints.
