const fs = require('fs');

let content = fs.readFileSync('src/components/InventoryRows.tsx', 'utf-8');

// Update GroupRowProps
content = content.replace(
    /interface GroupRowProps \{[\s\S]*?copyToClipboard: \(text: string, label: string\) => void;\n\}/,
    `interface GroupRowProps {
    group: InventoryGroup;
    style: React.CSSProperties;
    isExpanded: boolean;
    toggleExpand: (key: string) => void;
    allSelected: boolean;
    someSelected: boolean;
    onSelectGroup: (groupIds: string[], checked: boolean) => void;
    copyToClipboard: (text: string, label?: string) => void;
}`
);

// Update InventoryGroupRow
content = content.replace(
    /export const InventoryGroupRow = React\.memo\(\(\{\s*group,\s*style,\s*isExpanded,\s*toggleExpand,\s*selectedChildIds,\s*onSelectGroup,\s*copyToClipboard\s*\}\: GroupRowProps\) => \{[\s\S]*?const allSelected = items\.every\(i => selectedChildIds\.has\(i\.id\)\);\s*const someSelected = items\.some\(i => selectedChildIds\.has\(i\.id\)\);/,
    `export const InventoryGroupRow = React.memo(({
    group,
    style,
    isExpanded,
    toggleExpand,
    allSelected,
    someSelected,
    onSelectGroup,
    copyToClipboard
}: GroupRowProps) => {
    const { primaryItem, totalQuantity, aggregatedStatus, items } = group;`
);

content = content.replace(
    /onClick=\{toggleExpand\}/,
    `onClick={() => toggleExpand(group.groupKey)}`
);

// Wait, InventoryMobileGroupRow also has onClick={toggleExpand}
// Let's replace the one in InventoryMobileGroupRow as well
content = content.replace(
    /export const InventoryMobileGroupRow = React\.memo\(\(\{\s*group,\s*style,\s*isExpanded,\s*toggleExpand,[\s\S]*?\}\: GroupRowProps\) => \{[\s\S]*?onClick=\{toggleExpand\}/,
    (match) => {
        return match.replace('onClick={toggleExpand}', 'onClick={() => toggleExpand(group.groupKey)}');
    }
);

fs.writeFileSync('src/components/InventoryRows.tsx', content);
