## 2024-05-18 - [Missing JWT Expiration]
**Vulnerability:** JWT generated during login had no expiration set.
**Learning:** The `@fastify/jwt` wrapper's `jwtSign` method does not enforce a default expiration if omitted in the payload or options, resulting in tokens valid indefinitely.
**Prevention:** Always provide an explicit `{ expiresIn: '...' }` configuration when signing tokens, even if relying on a framework or wrapper plugin.
