## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2025-05-24 - Mobile Accessibility Parity
**Learning:** Mobile views often strip away `Tooltip` components (which are hover-based). This leaves icon-only buttons completely inaccessible to screen readers on touch devices unless explicit `aria-label` attributes are added.
**Action:** Always verify mobile-specific components (like `InventoryMobileChildRow`) and ensure they have `aria-label`s on icon buttons, even if the desktop equivalent relies on `Tooltip` for context.

## 2025-05-25 - Explicit Labels for Touch Targets
**Learning:** Helper components for mobile actions (like `MobileActionBtn`) often get created without `label` props, assuming icons are self-explanatory. This creates barriers for screen reader users on mobile where hover tooltips don't exist.
**Action:** Enforce a `label` prop on all mobile-specific action button components and map it to both `title` (for long-press) and `aria-label`.
## 2025-05-26 - GHS Icons Accessibility
**Learning:** Icon-only toggles for risk options were missing explicit `aria-label`s and used a `div` element with an `onClick` handler. This meant screen readers had no way to interact with or understand these toggles. Additionally, there were no focus outlines, breaking keyboard navigation.
**Action:** Changed the `div` to a `<button type="button">`, added `aria-pressed={isChecked}`, `aria-label={ghs.label}`, and `focus-visible` styles to ensure proper screen reader and keyboard support.

## 2024-02-15 - Accessible Toggle Switches
**Learning:** Visually hidden checkboxes paired with CSS-styled labels can lack proper keyboard focus indicators and standard screen reader support.
**Action:** Always prefer a semantic `<button type="button" role="switch" aria-checked="...">` for custom UI toggles instead of the checkbox hack, as it maps perfectly to accessibility trees and provides predictable keyboard interaction.
