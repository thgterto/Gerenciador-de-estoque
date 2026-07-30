## 2026-05-18 - [Fix XSS via document.write in Print Modal]
**Vulnerability:** Cross-Site Scripting (XSS) vulnerability caused by using `document.write` to render a print modal with unsanitized user inputs (`item.name`, `item.lotNumber`, etc.).
**Learning:** React handles XSS escaping internally, but when spawning new windows (`window.open`) and manually constructing HTML strings to render them, developers must implement their own sanitization or construct the DOM using safe APIs.
**Prevention:** Avoid `document.write` and manually interpolating untrusted data into HTML strings. Instead, use DOM manipulation APIs (like `document.createElement`, `textContent`) or utility functions to escape HTML entities before insertion.
