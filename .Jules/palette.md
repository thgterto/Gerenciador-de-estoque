## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2025-05-23 - Localization of Aria Labels
**Learning:** Accessibility attributes like `aria-label` must be localized just like visible text. The codebase had mixed English/Portuguese labels (e.g., "open drawer" vs "Sair").
**Action:** Always check the app's primary language and translate `aria-label`s accordingly to ensure a consistent experience for screen reader users.
