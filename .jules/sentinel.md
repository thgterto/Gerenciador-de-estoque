## 2026-07-07 - [XSS Fix in Modals.tsx]
**Vulnerability:** DOM-based XSS through document.write
**Learning:** string coercion before string replacements for html escaping
**Prevention:** Cast objects properties to string, like String(item.id).replace() instead of just item.id.replace() as numbers will fail without string methods.
