## 2026-03-10 - [Critical XSS Vulnerability in Print Modal]
**Vulnerability:** Found `dangerouslySetInnerHTML` and `document.write` used to render user data (`item.name`, `item.lotNumber`, etc.) directly into a new print window in `src/components/Modals.tsx` and `labcontrol-spfx/src/webparts/labControlApp/components/Modals.tsx`.
**Learning:** `document.write` with interpolated strings creates a critical XSS vector, especially when generating a new window for printing, because user input can execute scripts in that context.
**Prevention:** Instead of constructing HTML strings, use standard DOM manipulation methods (`document.createElement`, `element.textContent`, `element.appendChild`) to safely construct the document structure, ensuring data is treated as text, not executable HTML.
