const fs = require('fs');
let content = fs.readFileSync('.jules/bolt.md', 'utf-8');

const entry = `\n## 2025-02-14 - React.memo on Map callbacks
**Learning:** Components rendered inside a \`.map()\` callback inside a frequently updated component (like \`NativeHistoryList\`) will re-render unnecessarily if they are not memoized, especially when the parent state (\`visibleCount\`) changes but the items themselves remain stable.
**Action:** Always wrap row components (like \`HistoryRow\` and \`HistoryMobileRow\`) with \`React.memo\` when they are rendered in lists, and memoize the list container itself if its props are stable.`;

fs.writeFileSync('.jules/bolt.md', content + entry);
