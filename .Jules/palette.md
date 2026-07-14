## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2025-05-24 - Mobile Accessibility Parity
**Learning:** Mobile views often strip away `Tooltip` components (which are hover-based). This leaves icon-only buttons completely inaccessible to screen readers on touch devices unless explicit `aria-label` attributes are added.
**Action:** Always verify mobile-specific components (like `InventoryMobileChildRow`) and ensure they have `aria-label`s on icon buttons, even if the desktop equivalent relies on `Tooltip` for context.

## 2025-05-25 - Explicit Labels for Touch Targets
**Learning:** Helper components for mobile actions (like `MobileActionBtn`) often get created without `label` props, assuming icons are self-explanatory. This creates barriers for screen reader users on mobile where hover tooltips don't exist.
**Action:** Enforce a `label` prop on all mobile-specific action button components and map it to both `title` (for long-press) and `aria-label`.
## 2025-02-14 - [Toggle Button Accessibility]
**Learning:** Custom toggle buttons (like those used for status and category filters) often lack native state communication for screen readers. Simply relying on visual cues (like background color changes) is insufficient. Without `aria-pressed`, screen reader users don't know if a toggle button is currently active or inactive. Additionally, omitting `type="button"` inside forms (or in components that might be rendered inside forms) can lead to accidental form submissions.
**Action:** Always ensure that custom toggle buttons have `type="button"` and an `aria-pressed` attribute dynamically bound to their active state. Also, remember to add `aria-label` to icon-only or generic text buttons (like a generic "Limpar" / "Clear" button for a specific filter group) for better context.
