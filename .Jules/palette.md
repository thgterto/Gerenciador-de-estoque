## 2026-08-10 - ARIA Labels on Hidden Elements
**Learning:** Adding `aria-label` to an input with `className="hidden"` (display: none) does not actually improve accessibility, because screen readers ignore elements removed from the accessibility tree.
**Action:** Instead of adding aria attributes to hidden file inputs, ensure the visible button or label that triggers the hidden input has the proper accessible name/label.
