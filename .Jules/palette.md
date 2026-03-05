## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2025-05-24 - Mobile Accessibility Parity
**Learning:** Mobile views often strip away `Tooltip` components (which are hover-based). This leaves icon-only buttons completely inaccessible to screen readers on touch devices unless explicit `aria-label` attributes are added.
**Action:** Always verify mobile-specific components (like `InventoryMobileChildRow`) and ensure they have `aria-label`s on icon buttons, even if the desktop equivalent relies on `Tooltip` for context.

## 2025-05-25 - Explicit Labels for Touch Targets
**Learning:** Helper components for mobile actions (like `MobileActionBtn`) often get created without `label` props, assuming icons are self-explanatory. This creates barriers for screen reader users on mobile where hover tooltips don't exist.
**Action:** Enforce a `label` prop on all mobile-specific action button components and map it to both `title` (for long-press) and `aria-label`.

## 2026-03-01 - Input and Icon Button Accessibility in Modals
**Learning:** Complex interactive elements like numeric steppers (with `+` and `-` buttons) and direct number inputs in modals (e.g., QuickScanModal) are often built with `div` or generic `button` elements that lack context for screen readers. A purely visual `+` or `-` does not convey "Increase quantity" or "Decrease quantity".
**Action:** Always provide explicit `aria-label`s for icon-only buttons (like `+`/`-` or modal close buttons) and direct input fields that lack visible, associated `<label>` tags.
