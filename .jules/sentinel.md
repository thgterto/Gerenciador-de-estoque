## 2026-03-07 - [XSS] Sanitize user input in document.write
**Vulnerability:** Document.write was injecting unsanitized variables like item.name, item.lotNumber, item.expiryDate directly into the DOM inside `QRGeneratorModal`.
**Learning:** React's natural XSS protection (dangerouslySetInnerHTML avoidance) does not protect dynamically opened windows using `document.write`. Always manually sanitize variables going into raw HTML strings.
**Prevention:** Use an HTML escape utility function (`escapeHtml`) on any user input before injecting it into `document.write` or raw HTML strings.
