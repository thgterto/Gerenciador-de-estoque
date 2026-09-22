## 2026-08-13 - Input Accessibility with useId
**Learning:** Custom input components often miss explicit ID generation, breaking label associations and `aria-describedby` linking which are critical for screen reader compatibility.
**Action:** Always utilize React's `useId()` hook in foundational form components to automatically handle `htmlFor` and ARIA connections without requiring manual ID passing from parents.
