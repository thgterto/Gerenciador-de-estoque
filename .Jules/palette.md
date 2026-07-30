## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2025-05-24 - Mobile Accessibility Parity
**Learning:** Mobile views often strip away `Tooltip` components (which are hover-based). This leaves icon-only buttons completely inaccessible to screen readers on touch devices unless explicit `aria-label` attributes are added.
**Action:** Always verify mobile-specific components (like `InventoryMobileChildRow`) and ensure they have `aria-label`s on icon buttons, even if the desktop equivalent relies on `Tooltip` for context.

## 2025-05-25 - Explicit Labels for Touch Targets
**Learning:** Helper components for mobile actions (like `MobileActionBtn`) often get created without `label` props, assuming icons are self-explanatory. This creates barriers for screen reader users on mobile where hover tooltips don't exist.
**Action:** Enforce a `label` prop on all mobile-specific action button components and map it to both `title` (for long-press) and `aria-label`.
## 2024-05-18 - Replacing Native Title Attributes with Custom Tooltips
**Learning:** Relying on the native browser `title` attribute for icon-only buttons creates inconsistent and often delayed accessibility feedback. It's difficult to style and varies across browsers and operating systems, which degrades the experience for users who need immediate visual hints.
**Action:** Replaced native `title` attributes with the custom `Tooltip` component for all critical icon-only actions in the `Header` and `Sidebar` components. This provides immediate, styled, and consistent visual feedback on hover, improving both accessibility and general usability. Future icon-only buttons should default to using the `Tooltip` component.
