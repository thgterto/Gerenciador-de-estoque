## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2025-05-24 - Mobile Accessibility Parity
**Learning:** Mobile views often strip away `Tooltip` components (which are hover-based). This leaves icon-only buttons completely inaccessible to screen readers on touch devices unless explicit `aria-label` attributes are added.
**Action:** Always verify mobile-specific components (like `InventoryMobileChildRow`) and ensure they have `aria-label`s on icon buttons, even if the desktop equivalent relies on `Tooltip` for context.

## 2025-05-25 - Explicit Labels for Touch Targets
**Learning:** Helper components for mobile actions (like `MobileActionBtn`) often get created without `label` props, assuming icons are self-explanatory. This creates barriers for screen reader users on mobile where hover tooltips don't exist.
**Action:** Enforce a `label` prop on all mobile-specific action button components and map it to both `title` (for long-press) and `aria-label`.
## 2025-05-26 - QuickScanModal Accessibility
**Learning:** Icon-only interactive elements, such as the X close button and +/- quantity adjusters, require explicit `aria-label`s for screen reader support. Purely visual icons within buttons that have visible text (like the Zap and Activity icons in the AUTO-SCAN / MANUAL toggle) or are part of an explicitly labeled button (like the X icon) should be marked with `aria-hidden="true"` to prevent redundant or confusing screen reader announcements. Inputs without associated labels (like the quantity input) also require an `aria-label`.
**Action:** Always verify that icon-only buttons have descriptive `aria-label`s and that purely decorative/visual icons have `aria-hidden="true"`.
