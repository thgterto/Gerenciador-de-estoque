const fs = require('fs');

let content = fs.readFileSync('src/components/HistoryTable.tsx', 'utf-8');

// Use React.memo for HistoryRow and HistoryMobileRow
content = content.replace(
    /const HistoryRow = \(\{\s*item\s*\}\: \{\s*item\: MovementRecord\s*\}\) => \{/,
    `const HistoryRow = React.memo(({ item }: { item: MovementRecord }) => {`
);

content = content.replace(
    /const HistoryMobileRow = \(\{\s*item\s*\}\: \{\s*item\: MovementRecord\s*\}\) => \{/,
    `const HistoryMobileRow = React.memo(({ item }: { item: MovementRecord }) => {`
);

// We need to find where HistoryRow ends and add `});` instead of `};`
// A simpler way is to find the end of the component block:
content = content.replace(
    /      <\/div>\n    \);\n\};\n\nconst NativeHistoryList = /s,
    `      </div>\n    );\n});\n\nconst NativeHistoryList = `
);

// Same for HistoryMobileRow
content = content.replace(
    /        <\/div>\n    \);\n\};\n\nconst HistoryRow = /s,
    `        </div>\n    );\n});\n\nconst HistoryRow = `
);

fs.writeFileSync('src/components/HistoryTable.tsx', content);
