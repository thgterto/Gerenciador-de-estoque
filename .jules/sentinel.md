## 2025-02-18 - [Fix Insecure Server Configuration]
**Vulnerability:** The Fastify server (`server/src/app.ts`) was binding to `0.0.0.0` (all interfaces) by default, exposing the local backend to the entire network. Coupled with a default JWT secret, this created a critical security risk.
**Learning:** Default configurations in fastify, if not overridden properly, could lead to unexpected exposure, especially in electron apps running locally.
**Prevention:** Hardcode host bindings to '127.0.0.1' and use cryptographically secure default secrets for JWT variables when environmental fallbacks are not provided.
