## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-02-18 - Hardcoded Passwords in AuthContext
**Vulnerability:** Plaintext passwords for 'admin' and 'operador' were hardcoded in `MOCK_USERS` within `context/AuthContext.tsx`.
**Learning:** Even in "mock" or "simulation" code, storing credentials in plaintext is a security risk as it can easily be exposed if the code is bundled or shared.
**Prevention:** Always use hashing or secure storage for credentials, even in development or mock scenarios, to prevent accidental exposure.
