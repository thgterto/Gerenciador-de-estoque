## 2025-05-26 - XSS in Window Print Dialog
**Vulnerability:** The application was vulnerable to Cross-Site Scripting (XSS) in `src/components/Modals.tsx` and `labcontrol-spfx/src/webparts/labControlApp/components/Modals.tsx`. The application opened a new window and used `document.write` to generate HTML for printing, embedding unescaped variables like `item.name`, `item.lotNumber`, and `item.id`.
**Learning:** Using `document.write` with variables requires explicit HTML escaping, as modern framework protections (like React's JSX escaping) do not apply to raw string templates injected via `document.write`. Additionally, when writing ad-hoc escape functions, be sure to cast inputs using `String(value)` before calling `.replace()` to avoid runtime TypeErrors if the input happens to be numeric.
**Prevention:** Always sanitize user input before inserting it into raw HTML, using an `escapeHtml` function or DOM elements like `textContent`. Avoid `document.write` if possible.

## 2025-05-26 - Code Injection False Positive in Regex Loop
**Vulnerability:** The internal vulnerability scanner flagged a "Code Injection risk" in `SqlParser.ts` due to the use of `regex.exec(inner)` within a `while` loop.
**Learning:** Security scanners that use simple string matching (like searching for `exec(`) are prone to false positives, such as mistaking `RegExp.prototype.exec` for `child_process.exec`.
**Prevention:** Using modern JavaScript features like `String.prototype.matchAll()` instead of `RegExp.prototype.exec` in a `while` loop can avoid false positives from basic static analysis tools while also improving code readability and robustness.
