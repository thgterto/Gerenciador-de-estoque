# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Information Leakage in API Error Responses
**Vulnerability:** The server's error handler was returning raw exception messages to the client for 500 errors, potentially exposing database queries, file paths, or other internal implementation details.
**Learning:** Default error handling often prioritizes developer convenience (debugging) over security. Explicit environment checks (`NODE_ENV === 'production'`) are critical for toggling between verbose and safe error messages.
**Prevention:** Always implement a centralized error handler that sanitizes error messages in production builds, returning a generic "Internal Server Error" while logging the full details server-side.
## 2025-05-26 - DOM-Based XSS in QR Code Generator\n**Vulnerability:** The QR code generator modals ( and its copy in ) were using `document.write` to construct an HTML document for printing, interpolating unescaped item data (`name`, `lotNumber`, `expiryDate`, `id`). This created a high-severity DOM-based XSS vulnerability if this data originated from a malicious source.\n**Learning:** Even internal or local-first applications are vulnerable to XSS if they blindly render imported or user-supplied data into the DOM or new windows without sanitization.\n**Prevention:** Always escape user-controlled data before interpolating it into HTML strings, especially when using legacy APIs like `document.write` or `innerHTML`. Created and utilized a simple `escapeHtml` utility function in `stringUtils.ts` to mitigate this.

## 2025-05-26 - DOM-Based XSS in QR Code Generator
**Vulnerability:** The QR code generator modals (`Modals.tsx` and its copy in `labcontrol-spfx`) were using `document.write` to construct an HTML document for printing, interpolating unescaped item data (`name`, `lotNumber`, `expiryDate`, `id`). This created a high-severity DOM-based XSS vulnerability if this data originated from a malicious source.
**Learning:** Even internal or local-first applications are vulnerable to XSS if they blindly render imported or user-supplied data into the DOM or new windows without sanitization.
**Prevention:** Always escape user-controlled data before interpolating it into HTML strings, especially when using legacy APIs like `document.write` or `innerHTML`. Created and utilized a simple `escapeHtml` utility function in `stringUtils.ts` to mitigate this.
