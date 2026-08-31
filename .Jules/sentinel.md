# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.

## 2023-08-31 - Fastify Global Error Handler
**Vulnerability:** Fastify routes manually caught errors and sent raw `error.message` to clients, bypassing the global error handler which is responsible for safely filtering error details in production. Furthermore, JWT authentication failures in `onRequest` hooks sent raw error objects directly to clients via `reply.send(err)`.
**Learning:** Fastify natively handles rejected promises. Manually handling `try/catch` and sending custom error responses circumvents Fastify's centralized `errorHandler` (which we have configured to hide internal errors in production). JWT verification errors should be masked as standard 401 Unauthorized responses to avoid leaking implementation details.
**Prevention:** Rely on Fastify's native async error handling by simply throwing errors or returning rejected promises in route handlers. Use standard HTTP status codes (like 401) with generic messages for authentication/authorization failures.
