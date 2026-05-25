## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2025-05-24 - Mobile Accessibility Parity
**Learning:** Mobile views often strip away `Tooltip` components (which are hover-based). This leaves icon-only buttons completely inaccessible to screen readers on touch devices unless explicit `aria-label` attributes are added.
**Action:** Always verify mobile-specific components (like `InventoryMobileChildRow`) and ensure they have `aria-label`s on icon buttons, even if the desktop equivalent relies on `Tooltip` for context.

## 2025-05-25 - Explicit Labels for Touch Targets
**Learning:** Helper components for mobile actions (like `MobileActionBtn`) often get created without `label` props, assuming icons are self-explanatory. This creates barriers for screen reader users on mobile where hover tooltips don't exist.
**Action:** Enforce a `label` prop on all mobile-specific action button components and map it to both `title` (for long-press) and `aria-label`.

## 2025-05-25 - Standardizing ARIA Labels in Modals and Toasts
**Learning:** Found several icon-only buttons across modal dialogs (like `QuickScanModal`) and transient UI components (like `Toast`) that were missing explicit `aria-label`s. Screen readers rely heavily on clear labels in high-stress, temporary interactions like toasts or scanning interfaces where context might shift quickly. It is also important to ensure `aria-label` values are written in the same language as the surrounding UI context to avoid confusing screen reader announcements (e.g. use "Close notification" instead of "Fechar notificação" if the context is mostly English).
**Action:** When adding or reviewing modal, scanner, or toast elements, always provide concise and action-oriented `aria-label`s (e.g., "Close notification", "Clear filter") in the appropriate language for any icon-only controls.
