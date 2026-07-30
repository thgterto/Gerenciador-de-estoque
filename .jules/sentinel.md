## 2026-05-14 - [Fixed XSS in QR Code Printing]
**Vulnerability:** DOM-based Cross-Site Scripting (XSS) in src/components/Modals.tsx where user input (item.name, item.lotNumber, item.id) was directly injected into document.write() for printing.
**Learning:** Even internal windows meant for printing need proper input sanitization. document.write() is inherently dangerous when mixed with user data, leading to easy XSS vectors if an attacker modifies item names or lot numbers.
**Prevention:** Avoid document.write() completely. Construct new window DOMs safely using document.createElement() and .textContent to ensure data is treated as text and not executable HTML.
