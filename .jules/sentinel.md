## 2025-05-21 - Hardcoded JWT Secret Removed
**Vulnerability:** A hardcoded string (`supersecret_change_me_in_prod`) was being used as a fallback for the JWT secret in `server/src/config.ts`.
**Learning:** Even default/placeholder secrets in local or dev setups can accidentally leak into production if the env var is missed.
**Prevention:** Always throw an error if a sensitive environment variable is missing in production. For local development, fallback to a dynamically generated strong random string (e.g. `crypto.randomBytes(32).toString('hex')`) rather than a hardcoded string, and warn the user.
