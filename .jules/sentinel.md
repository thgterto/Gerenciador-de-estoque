## 2025-02-28 - [XSS] Unescaped document.write in Modals.tsx
**Vulnerability:** In `handlePrint`, user inputs (`item.name`, `item.lotNumber`, `item.id`) were directly injected into an HTML string passed to `document.write()`.
**Learning:** React developers often forget that manual DOM manipulation or window creation (`window.open().document.write()`) bypasses React's built-in XSS protections.
**Prevention:** Always escape user input before injecting it into raw HTML strings, even when generating isolated print windows. Use a simple `escapeHtml` function or DOMPurify if complex HTML is allowed.
