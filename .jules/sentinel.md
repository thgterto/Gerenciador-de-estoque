## 2025-02-23 - [Sanitizing inputs before `document.write`]
**Vulnerability:** Found a Cross-Site Scripting (XSS) vulnerability in `Modals.tsx` where user inputs were being directly interpolated into an HTML string passed to `printWindow.document.write()`.
**Learning:** `document.write()` executes script tags or allows for HTML injection if inputs are not properly sanitized. Type-checking properties to string during escaping prevents fallback values that evaluate to a number causing a `TypeError`.
**Prevention:** Avoid `document.write` entirely, or at minimum, enforce strict HTML-escaping with string coercions before outputting untrusted text.
