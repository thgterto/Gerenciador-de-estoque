# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2026-02-21 - XSS in Electron Print Window
**Vulnerability:** The QR Code generator was using `document.write()` to build a new print window using user-controlled data (`item.name`, `item.lotNumber`) without escaping HTML characters. This could allow execution of arbitrary JavaScript if the item name contained malicious payloads.
**Learning:** `document.write()` in Electron (or webviews generally) treats interpolated strings as raw HTML. Even if the main UI is React (which escapes by default), dynamically generated content for print windows bypasses this protection.
**Prevention:** Always escape user input when constructing raw HTML strings, especially for `document.write` or `innerHTML`. Use a utility function like `escapeHtml` to sanitize input.
