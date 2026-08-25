# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.

## 2026-04-30 - [XSS] Unescaped user data in document.write for print window
**Vulnerability:** A Cross-Site Scripting (XSS) vulnerability was found in the `handlePrint` function of the Modals component where user data (`item.name`, `item.lotNumber`, `item.expiryDate`, `item.id`) was directly interpolated into a `document.write` template string without any HTML escaping.
**Learning:** `document.write` is particularly dangerous when constructing complete HTML documents using dynamic data, as it bypasses React's built-in XSS protections (which only apply to JSX/React node rendering).
**Prevention:** Avoid `document.write` entirely if possible, opting for creating elements via DOM APIs (`document.createElement`, `textContent`) or React Portals for print views. If `document.write` must be used for legacy/compatibility reasons (like simple print popups), all injected user data MUST be strictly escaped using a dedicated HTML escape function replacing `<, >, &, ", '`.
