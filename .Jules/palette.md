## 2025-05-23 - Accessibility of Icon Buttons
**Learning:** When using icon fonts (like Material Symbols) in buttons, simply adding `aria-label` to the button isn't enough. Screen readers may still try to read the ligature text (e.g., "content_copy") which is confusing.
**Action:** Always add `aria-hidden="true"` to the icon element itself when an accessible label (visible text or `aria-label`) is provided.

## 2025-05-23 - Transitioning State-Dependent UI
**Learning:** Using `Grow` (or any exit transition) on a component that renders state (like "5 selected") can look jarring if the state is cleared immediately to trigger the exit (showing "0 selected" while fading out).
**Action:** For perfect UX, use a separate display state that updates *after* the exit animation completes, or use `AnimatePresence` with `custom` props to hold the previous value. For simple cases, accept the quirk or use `unmountOnExit` with a delay.

## 2025-05-23 - The "Precision Brutalist" Shift
**Learning:** Moving from "Safe Harbor" (rounded corners, soft shadows) to "Precision Brutalist" (sharp edges, technical fonts, high contrast) immediately transforms the user's perception from "generic SaaS" to "professional tool".
**Action:** For technical applications (inventory, monitoring), prioritize data clarity (Monospace numbers, uppercase headers) over "friendly" UI elements. Use sharp borders (`rounded-none`) to create a distinct, reliable identity.
