## YYYY-MM-DD - Date Instantiation in render loops
**Learning:** Instantiating `new Date()` within render loops like `.map()` arrays is an unnecessary performance hit due to garbage collection and object instantiation overhead. Wait, no need to add since we already knew this.
## 2025-03-05 - Avoid IIFE in React JSX
**Learning:** Hoisting variables via an Immediately Invoked Function Expression (IIFE) inside a React JSX return (e.g. `{(() => { const now = Date.now(); return list.map(...) })()}`) creates a new function instance on every render, severely cluttering the code and potentially negating the micro-optimization.
**Action:** Always declare local constants like `const now = Date.now();` at the top level of the component's render body or before the `return` statement.
