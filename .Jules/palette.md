## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2026-02-14 - Mobile Accessibility
**Learning:** Tooltips are ineffective on touch devices as there is no hover state. Icon-only buttons relying solely on tooltips for accessibility are unusable on mobile for screen reader users and confusing for visual users who don't know what the icon means.
**Action:** Always ensure icon-only buttons have explicit `aria-label` attributes, especially for mobile-specific views.
