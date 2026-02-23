# Sentinel Security Journal

## 2025-02-23 - Missing Content Security Policy in Electron App
**Vulnerability:** The application lacked a Content Security Policy (CSP), leaving it vulnerable to Cross-Site Scripting (XSS) attacks if any dependency or input handling was compromised.
**Learning:** Even "portable" offline-first Electron apps often load external resources (CDNs for fonts/scripts) and need CSP. Vite development mode complicates this by requiring `unsafe-eval`, but `unsafe-inline` for scripts can be avoided.
**Prevention:** Enforce CSP via `<meta>` tag in `index.html` as a standard practice for all Electron renderers, ensuring it covers both production (bundled) and development (HMR) needs without being overly permissive.

## 2025-02-23 - Missing External Navigation Prevention in Electron Main Process
**Vulnerability:** The Electron main window allowed navigation to external URLs (e.g., via malicious links or redirects), potentially exposing the application context to phishing sites or malicious content within the trusted window frame.
**Learning:** `setWindowOpenHandler` only intercepts new window creation (e.g., `target="_blank"`), but does not prevent navigation within the existing window (e.g., standard links or `window.location`).
**Prevention:** Implement a `will-navigate` handler on `webContents` to strictly block external navigation and force opening in the default system browser using `shell.openExternal()`.
