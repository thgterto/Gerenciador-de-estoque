const fs = require('fs');
let content = fs.readFileSync('docs/PERFORMANCE.md', 'utf-8');

const entry = `
### 4. History List Re-renders Optimization (\`HistoryTable.tsx\`)
**Problem:** Changing the \`visibleCount\` by clicking "Carregar Mais" caused all previously rendered \`HistoryRow\` and \`HistoryMobileRow\` components to re-render, blocking the main thread.
**Solution:** Wrapped \`HistoryRow\`, \`HistoryMobileRow\`, and \`NativeHistoryList\` in \`React.memo()\` to prevent unnecessary re-renders of list items whose props haven't changed.
**Impact:**
- Clicking "Carregar Mais" is now instant, regardless of how many items are already visible.
- Reduces CPU spikes when paginating through large history lists.`;

content = content.replace(/---\n\n## 🏗 Architectural Patterns for Performance/, entry + '\n\n---\n\n## 🏗 Architectural Patterns for Performance');

fs.writeFileSync('docs/PERFORMANCE.md', content);
