## 2025-05-23 - Information Exposure via Error Handling
**Vulnerability:** The Google Apps Script backend was exposing full stack traces in the JSON response when an error occurred (`stack: error.stack`).
**Learning:** This is a common pattern in development but dangerous in production. It reveals internal file paths, function names, and logic structure to potential attackers, aiding in reconnaissance.
**Prevention:** Always sanitize error messages sent to the client. Use `console.error` for internal logging (which goes to the platform's secure logs) and return generic or safe error messages to the user.

## 2025-05-24 - LFI Risk in Electron Window Handler
**Vulnerability:** The Electron `setWindowOpenHandler` was configured to `allow` non-http/https URLs by default (`return { action: 'allow' }`). This could allow `file://` URLs to open a new window if a malicious link was clicked, potentially exposing local files (Local File Inclusion).
**Learning:** Defaulting to `allow` in security handlers is a violation of "Deny by Default". In Electron, `allow` inherits permissions and can open local files if the URL scheme is `file://`.
**Prevention:** Always configure `setWindowOpenHandler` to `deny` by default. Explicitly whitelist protocols (e.g., `https:`, `mailto:`) that should be handled externally via `shell.openExternal`.

## 2025-05-24 - Missing Navigation Security in Electron Main Process
**Vulnerability:** The Electron application lacked a `will-navigate` handler, allowing the main window to navigate to arbitrary external URLs if triggered by a malicious link or script. This could lead to phishing attacks within the trusted application context.
**Learning:** `setWindowOpenHandler` only protects against `window.open` or `target="_blank"`. It does not prevent navigation within the *same* window (e.g., standard links or location changes). In a Single Page Application (SPA), legitimate navigation is handled by the History API, which does not trigger `will-navigate`. Therefore, it is safe and recommended to block *all* `will-navigate` events to external URLs in an SPA context.
**Prevention:** Implement a `will-navigate` handler on `mainWindow.webContents` that intercepts and prevents navigation to external protocols (http/https/mailto) and instead opens them in the default browser using `shell.openExternal`.
