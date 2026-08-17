## 2025-02-28 - Removed hardcoded credentials and error leaks
**Vulnerability:** Hardcoded admin credentials and exposed error stack traces.
**Learning:** In a frontend-only app with a mock DB, hardcoded secrets are still a risk. We must use environment variables as a minimum, and ensure stack traces are stripped before being rendered in Error Boundaries.
**Prevention:** Always use environment variables (e.g. `import.meta.env.VITE_*`) instead of plaintext strings. Avoid rendering raw `error.toString()` or `error.stack` to the UI, replacing them with generic user-friendly messages.
