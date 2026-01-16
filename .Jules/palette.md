## 2026-01-16 - Accessibility Win: Interactive Divs -> Buttons
**Learning:** Changing interactive `div`s to `button` elements with `aria-pressed` is a high-impact, low-effort accessibility win. It instantly enables keyboard navigation and screen reader support without complex ARIA management on non-semantic elements.
**Action:** Scan codebase for `onClick` handlers on `div` or `span` elements and refactor to `button`s where they represent actions.
