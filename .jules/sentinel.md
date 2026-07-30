## 2025-02-18 - [DOM-based XSS in Print Windows]
**Vulnerability:** Found a DOM-based Cross-Site Scripting (XSS) vulnerability in `src/components/Modals.tsx` and `labcontrol-spfx/src/webparts/labControlApp/components/Modals.tsx`. Unsanitized variables like `item.name` were being directly injected into `printWindow.document.write()`.
**Learning:** Generating "Print" windows via `document.write` requires explicit sanitization of all dynamic variables, as they run in the origin's context. Standard React sanitization (`{item.name}`) does not protect plain string interpolations inside raw JS blocks.
**Prevention:** Avoid `document.write()` whenever possible. When necessary, use a robust `escapeHtml` function to sanitize user-provided variables before injection.
