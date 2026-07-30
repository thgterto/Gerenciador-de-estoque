## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2025-05-24 - Mobile Accessibility Parity
**Learning:** Mobile views often strip away `Tooltip` components (which are hover-based). This leaves icon-only buttons completely inaccessible to screen readers on touch devices unless explicit `aria-label` attributes are added.
**Action:** Always verify mobile-specific components (like `InventoryMobileChildRow`) and ensure they have `aria-label`s on icon buttons, even if the desktop equivalent relies on `Tooltip` for context.

## 2025-05-25 - Explicit Labels for Touch Targets
**Learning:** Helper components for mobile actions (like `MobileActionBtn`) often get created without `label` props, assuming icons are self-explanatory. This creates barriers for screen reader users on mobile where hover tooltips don't exist.
**Action:** Enforce a `label` prop on all mobile-specific action button components and map it to both `title` (for long-press) and `aria-label`.

## 2026-05-13 - Hidden File Inputs Accessibility
**Learning:** When using `<input type="file" className="hidden" />` accompanied by a custom trigger button, screen readers may still intercept the hidden input structure if its not cleanly labeled, throwing automated accessibility validation errors.
**Action:** Add explicit `aria-label` to custom hidden file inputs even if they are functionally obscured.

## 2026-05-13 - Focus Flow in Layout
**Learning:** React SPA apps often lack native keyboard navigation landmarks (skip-to-content links), which can frustrate users who rely on the tab key to bypass lengthy sidebars and headers on every new page load.
**Action:** When working on application-level shells (e.g., Layout wrappers), always integrate an off-screen `skip-to-main-content` anchor link mapped to a unique `main` container `id`.