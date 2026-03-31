## 2025-03-30 - Fix Hardcoded JWT Secret
**Vulnerability:** A hardcoded, known JWT secret (`'supersecret_change_me_in_prod'`) was present in `server/src/config.ts` as a fallback if the `JWT_SECRET` environment variable was not provided.
**Learning:** Hardcoded default secrets are a critical security vulnerability. If deployed with default configuration, it allows attackers to forge valid JWTs and bypass authentication.
**Prevention:** Instead of hardcoded strings, use a secure, randomly generated fallback at runtime (e.g., `crypto.randomBytes(32).toString('hex')`). This guarantees that sessions are secure, even if it means sessions are invalidated on application restart when the environment variable is not explicitly set.
