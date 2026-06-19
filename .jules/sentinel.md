## 2025-06-19 - Hardcoded JWT Secret in Server Config
**Vulnerability:** A fallback JWT secret (`supersecret_change_me_in_prod`) was hardcoded in `server/src/config.ts`. If `JWT_SECRET` wasn't set in production, this default would be used, allowing anyone to forge tokens.
**Learning:** Development fallbacks for secrets are dangerous because they are frequently pushed to production deployments by mistake.
**Prevention:** Always throw an error if required secrets are missing in production (`NODE_ENV === 'production'`). For local development, use `crypto.randomBytes(32).toString('hex')` to generate a secure ephemeral secret so that a hardcoded string is never needed in the codebase.
