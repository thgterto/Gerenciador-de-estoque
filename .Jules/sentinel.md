# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.

## 2026-07-12 - Information Leakage and Authentication Bypass in Fastify Try/Catch Blocks
**Vulnerability:** Fastify `onRequest` hooks and `async` route handlers wrapped their logic in `try-catch` blocks that handled errors manually. In `app.ts`, `catch (err) { reply.send(err); }` allowed the asynchronous function to resolve successfully instead of throwing, which tricked Fastify into proceeding to the route handler even after authentication failed. In `InventoryController.ts`, `catch (error) { res.status(500).send({ error: error.message }); }` bypassed the secure global error handler and leaked raw internal error messages to the client.
**Learning:** Fastify natively handles unhandled promise rejections in `async` routes and hooks. Catching them manually without explicitly re-throwing or halting the lifecycle leads to silent authentication bypasses and information leakage.
**Prevention:** Avoid wrapping Fastify `async` routes and hooks in `try-catch` blocks unless you are executing custom recovery logic. Allow errors to bubble up naturally to the `errorHandler` for secure processing.
