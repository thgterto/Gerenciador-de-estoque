## 2024-06-17 - [Fix XSS via document.write in Modals]
**Vulnerability:** Found a High-risk Cross-Site Scripting (XSS) vulnerability in `src/components/Modals.tsx` and `labcontrol-spfx/src/webparts/labControlApp/components/Modals.tsx` where user-controlled variables (like item.name) were written directly into an HTML template using `printWindow.document.write()`.
**Learning:** Even internal print windows or modals are susceptible to DOM-based XSS if the inputs are not sanitized, because an attacker could craft an item name with embedded `<script>` tags that execute when the print window opens.
**Prevention:** Always use an HTML escaping function (converting `<`, `>`, `&`, `"`, `'` to their HTML entities) before interpolating any dynamic user data into a raw HTML string.
