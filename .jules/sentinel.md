## 2026-04-27 - Fixed XSS vulnerability in Label Printing
**Vulnerability:** XSS vulnerability in `src/components/Modals.tsx` and `labcontrol-spfx/src/webparts/labControlApp/components/Modals.tsx` where user data (`item.name`, `item.lotNumber`, `item.id`) was directly interpolated into HTML strings inside `document.write` without escaping.
**Learning:** React automatically escapes HTML content rendered as JSX, but when building raw HTML strings to pass into lower-level browser APIs like `document.write()`, developers must manually escape user-controlled variables.
**Prevention:** Implement and use a safe `escapeHtml` utility whenever generating raw HTML templates. Ensure security scanners are equipped to flag potentially unsafe raw DOM methods.
