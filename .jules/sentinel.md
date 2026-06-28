## 2025-06-28 - Hardcoded JWT Secret in Production
**Vulnerability:** Hardcoded JWT secret fallback in `server/src/config.ts`.
**Learning:** Fallback secrets can inadvertently be used in production if the environment variable is not set, compromising all generated tokens.
**Prevention:** Generate a strong random fallback secret at runtime using `crypto.randomBytes(32).toString('hex')` or fail to start without a configured secret in production.
## 2025-06-28 - Hardcoded JWT Secret in Production
**Vulnerability:** Hardcoded JWT secret fallback in `server/src/config.ts`.
**Learning:** Fallback secrets can inadvertently be used in production if the environment variable is not set, compromising all generated tokens.
**Prevention:** Generate a strong random fallback secret at runtime using `crypto.randomBytes(32).toString('hex')` or fail to start without a configured secret in production. Note that using a random key invalidates existing sessions when the server is restarted.
