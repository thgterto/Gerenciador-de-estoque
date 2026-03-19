## 2023-10-27 - [Quick Scan Accessibility]
**Learning:** Custom numeric input controls (with manual +/- buttons) and custom state toggle buttons (like IN/OUT) often miss crucial accessibility hints.
**Action:** Always ensure custom +/- buttons have `type="button"`, `aria-label`, and `title`. For custom toggle switches or mode selectors, add `aria-pressed` to indicate their current state to screen readers, and an `aria-label` to the associated `<input>` if it lacks an explicit `<label>`.
