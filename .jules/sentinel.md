## 2025-02-27 - [Information Exposure]
**Vulnerability:** The Fastify JWT verification endpoints (`app.ts`) and GoogleAppsScript backend returned raw error objects on failure.
**Learning:** By default, returning `reply.send(err)` without an explicit status code leaks internal application state, error descriptions, and possibly stack traces.
**Prevention:** Always catch and sanitize authentication errors to return a generic HTTP 401 response and avoid leaking internals.
