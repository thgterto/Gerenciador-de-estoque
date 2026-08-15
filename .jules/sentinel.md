## 2024-05-24 - Fix XSS Vulnerability in Modals.tsx
**Vulnerability:** XSS vulnerability through unsanitized user inputs (`item.name`, `item.lotNumber`, `item.id`) in `document.write(...)` used for printing QR codes.
**Learning:** React escapes content in JSX, but raw DOM methods like `document.write()` or `dangerouslySetInnerHTML` require manual sanitization, especially when rendering user-controlled data like names and IDs which could contain script tags.
**Prevention:** Always encode output (e.g. using a custom HTML entity encoder or DOMPurify) when injecting dynamic content directly into the DOM outside of React's render lifecycle.
