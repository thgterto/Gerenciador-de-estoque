## 2024-05-15 - [XSS in Print Modals]
**Vulnerability:** XSS vulnerability found in QR code print templates via `document.write`. Unsanitized user inputs (item name, lot number, etc.) were being directly interpolated into an HTML string, allowing for script execution if a user entered malicious HTML/JS into those fields.
**Learning:** `document.write` combined with template literals and user data is a highly dangerous pattern for XSS in React apps when generating new windows/iframes for printing.
**Prevention:** Always sanitize/escape user inputs before inserting them into raw HTML strings. A simple `escapeHtml` utility function replacing `<`, `>`, `&`, `"`, `'` with their respective HTML entities is effective for this specific pattern.
