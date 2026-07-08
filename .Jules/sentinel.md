# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.

## 2024-07-08 - XSS in Window Print Dialogs
**Vulnerability:** Found unescaped user inputs (`item.name`, `item.lotNumber`, `item.id`) being interpolated directly into a new window's HTML via `document.write` in the `handlePrint` functionality (`src/components/Modals.tsx` and `labcontrol-spfx/src/webparts/labControlApp/components/Modals.tsx`).
**Learning:** `document.write` is a classic DOM XSS sink. Even if data isn't rendered directly in the main React application (which automatically escapes values), rendering data in a new popup window manually requires explicit HTML escaping to prevent XSS payloads from executing in the context of the application.
**Prevention:** Created a central `escapeHtml` utility and applied it to all dynamic fields inserted into `document.write`. Always sanitize or escape any dynamic input used when manually constructing HTML strings.
