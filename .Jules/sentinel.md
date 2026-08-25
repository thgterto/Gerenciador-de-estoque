# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.

## 2025-02-23 - DOM-based Cross-Site Scripting (XSS) in document.write
**Vulnerability:** The application was using `document.write()` to dynamically generate a printable HTML document, but it failed to sanitize user-controlled inputs (such as `item.name`, `item.lotNumber`, and `item.id`) before interpolating them into the HTML string. This exposed the application to DOM-based XSS attacks.
**Learning:** Functions that interpret strings as code (like `document.write`, `innerHTML`, `eval`) are notorious sources of XSS vulnerabilities when dealing with user data. In modern applications, avoiding `document.write` is preferable, but if used (e.g., for generating a print window), all interpolated data must be strictly escaped.
**Prevention:** Always sanitize or HTML-escape user inputs when constructing HTML strings dynamically. I have introduced an `escapeHtml` utility to convert characters like `<`, `>`, `&`, `"`, and `'` into their corresponding HTML entities.
