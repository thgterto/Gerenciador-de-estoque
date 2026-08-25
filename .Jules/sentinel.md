# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.

## 2025-02-23 - XSS in DOM Injection (`document.write`)
**Vulnerability:** DOM-based Cross-Site Scripting (XSS) in QR code printing functionality. User-controlled inventory item names, lots, and IDs were being directly interpolated into a `printWindow.document.write()` template without escaping.
**Learning:** While React automatically sanitizes variables rendered in JSX, rendering logic that sidesteps React entirely (like native DOM manipulation or `document.write` for printing windows) completely circumvents this protection.
**Prevention:** Always apply an HTML escaping utility to external or user-provided data when dynamically assembling HTML strings outside of a framework's built-in rendering cycle.
