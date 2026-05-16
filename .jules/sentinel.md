## 2026-05-16 - [XSS] Unescaped document.write in Modals.tsx
**Vulnerability:** User-controlled fields (`item.name`, `item.lotNumber`, `item.id`) were directly interpolated into HTML strings and passed to `printWindow.document.write()`. This opened the application to Cross-Site Scripting (XSS) when printing labels.
**Learning:** Even internal tool interfaces (like label printers) must treat data as untrusted. XSS can be executed in newly opened windows via `document.write` if escaping is missed.
**Prevention:** Always sanitize/escape user data before interpolating into HTML templates, especially when dynamically generating full HTML documents for printing. Use a robust string escaping function or build DOM elements explicitly.
