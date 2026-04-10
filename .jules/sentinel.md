## 2026-04-10 - [Fix XSS in `document.write` for QR generation modal]
**Vulnerability:** XSS in QR Code label generation using unescaped string interpolation in `document.write`.
**Learning:** `document.write` combined with string interpolation directly exposes properties to XSS.
**Prevention:** Use an HTML escape function when interpolating string variables directly into an HTML template structure, especially when passing the string to `document.write` or setting inner HTML.
