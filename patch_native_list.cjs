const fs = require('fs');

let content = fs.readFileSync('src/components/HistoryTable.tsx', 'utf-8');

// Replace NativeHistoryList with memoized version
content = content.replace(
    /const NativeHistoryList = \(\{ filtered, isMobile \}: \{ filtered: MovementRecord\[\], isMobile: boolean \}\) => \{/,
    `const NativeHistoryList = React.memo(({ filtered, isMobile }: { filtered: MovementRecord[], isMobile: boolean }) => {`
);

content = content.replace(
    /        <\/div>\n    \);\n\};\n\nexport const HistoryTable/s,
    `        </div>\n    );\n});\n\nexport const HistoryTable`
);

fs.writeFileSync('src/components/HistoryTable.tsx', content);
