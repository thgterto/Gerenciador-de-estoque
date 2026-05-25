## 2025-05-25 - [Fix JWT Secret hardcoded in backend]
**Vulnerability:** A hardcoded secret was found in the JWT secret environment fallback, which is a major security risk for signed auth tokens.
**Learning:** Found it at server/src/config.ts line 10, exposed fallback string supersecret_change_me_in_prod.
**Prevention:** Avoid defining raw strings in source code for auth tokens or critical secrets. Always fallback to a randomly generated volatile string so local setups don't use hardcoded predictable keys.
