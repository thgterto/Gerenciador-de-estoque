## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2026-02-13 - Mobile vs Desktop Accessibility
**Learning:** The application separates row components for mobile (`InventoryMobileChildRow`) and desktop (`InventoryChildRow`). While desktop rows often use `Tooltip` components which can provide fallback accessible names, mobile rows typically lack these, making explicit `aria-label` attributes critical for accessibility on touch devices.
**Action:** When adding actions to lists, always check both mobile and desktop implementations and ensure `aria-label` is present on both, especially for mobile where tooltips are absent.
