## 2026-10-11 - [Fastify Auth Bypass & Global Security Headers]
**Vulnerability:** Fastify `onRequest` hooks for JWT verification caught validation errors, called `reply.send(err)`, but failed to `return` the reply. This anti-pattern can allow route execution to continue despite authentication failures.
**Learning:** In Fastify async hooks, calling `reply.send()` does not halt the execution chain. You must explicitly `return reply.send(...)` or `throw` to stop the request lifecycle and prevent unauthorized access to the route handler.
**Prevention:** Always ensure `return` is used in async `onRequest` hooks when sending an error response to abort the execution flow.

Additionally, implemented standard global security headers (CSP, HSTS, X-Frame-Options) across the API for defense in depth.
