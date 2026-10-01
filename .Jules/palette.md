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

## 2025-05-27 - Custom Toggle Groups Accessibility
**Learning:** Custom UI toggles (like category chips or status filters) built with generic `<button>` elements are often missing state announcements for screen readers. While visual users see the state via CSS (e.g., background color), screen readers just announce "button", leaving users unaware of which filters are active.
**Action:** Always add `aria-pressed={true/false}` to custom toggle buttons or chips to explicitly communicate their active state, and ensure they have a `type="button"` to avoid accidental form submissions, along with `focus-visible` styles for keyboard navigation.
