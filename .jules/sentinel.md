## Sentinel's Journal
## 2024-06-10 - Fixed XSS in Label Printing Modal
**Vulnerability:** XSS vulnerability in `src/components/Modals.tsx` when printing labels. `item.name`, `item.lotNumber`, `item.id`, and `item.expiryDate` were directly interpolated into an HTML string passed to `document.write()`.
**Learning:** React elements are safe from XSS by default, but when manually constructing HTML strings (like for `document.write` to open a print window or `dangerouslySetInnerHTML`), developers must sanitize user input explicitly.
**Prevention:** Added `escapeHtml` utility in `src/utils/stringUtils.ts` and used it to sanitize variables before interpolating them into HTML strings.
