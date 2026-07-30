## 2025-02-21 - [CRITICAL] Fix hardcoded JWT secret fallback
**Vulnerability:** A hardcoded fallback secret (`'supersecret_change_me_in_prod'`) was used for JWT generation in the fastify API server (`server/src/config.ts`) when `JWT_SECRET` wasn't provided.
**Learning:** Hardcoded fallback values for cryptographic secrets are dangerous. If the `JWT_SECRET` environment variable is accidentally omitted in production, an attacker could forge JWT tokens and gain unauthorized access to the application since the fallback secret is known in the source code.
**Prevention:** Use a securely generated ephemeral random secret (e.g., `crypto.randomBytes(32).toString('hex')`) as a fallback so tokens cannot be forged in case of missing environment configuration.
