## 2023-10-25 - [XSS Fix]
**Vulnerability:** DOM-based XSS via `document.write` in print label window.
**Learning:** Variables interpolated into raw HTML string for `document.write` are vulnerable to XSS if not escaped.
**Prevention:** Always escape user-controlled variables before interpolation into HTML strings.
