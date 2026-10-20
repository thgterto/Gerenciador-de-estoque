import React, { useEffect, useRef } from 'react';
import { OrbitalCard } from '../ui/orbital/OrbitalCard';
import { EmptyState } from '../ui/EmptyState';
import {
    InventoryChildRow,
    InventoryGroupRow,
    InventoryMobileGroupRow,
    InventoryMobileChildRow
} from '../InventoryRows';
import { UserRole } from '../../types';
import { VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

// Virtualized Row Component defined outside render scope to avoid re-mounting
// Ensure VirtualRow has a custom arePropsEqual function to avoid massive re-renders when itemData changes
const areEqual = (prevProps: any, nextProps: any) => {
    const prevItem = prevProps.data.flatList[prevProps.index];
    const nextItem = nextProps.data.flatList[nextProps.index];

    // Fast path: if the item reference changed, re-render
    if (prevItem !== nextItem) return false;

    // Check if selection state changed for this specific item
    if (nextItem.type !== 'GROUP') {
        const prevSelected = prevProps.data.selectedIds.has(prevItem.data.id);
        const nextSelected = nextProps.data.selectedIds.has(nextItem.data.id);
        if (prevSelected !== nextSelected) return false;
    } else {
        // Group row selection logic relies on child IDs which changes the flatList references,
        // but we can check if the group's expanded state changed via flatList which is already checked
        // If selection changes for children of group, we should re-render the group to show indeterminate/checked
        const prevSelectedCount = prevItem.data.items.filter((i: any) => prevProps.data.selectedIds.has(i.id)).length;
        const nextSelectedCount = nextItem.data.items.filter((i: any) => nextProps.data.selectedIds.has(i.id)).length;
        if (prevSelectedCount !== nextSelectedCount) return false;
    }

    return true;
};

const VirtualRow = React.memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
    const {
        flatList,
        isMobile,
        selectedIds,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        toggleGroupExpand,
        copyToClipboard,
        hasRole
    } = data;

    const rowItem = flatList[index];
    const isSelected = rowItem.type !== 'GROUP' && selectedIds.has(rowItem.data.id);

    if (rowItem.type === 'GROUP') {
        if (isMobile) {
            return (
                <InventoryMobileGroupRow
                    group={rowItem.data}
                    style={style}
                    isExpanded={rowItem.expanded}
                    toggleExpand={() => toggleGroupExpand(rowItem.data.groupKey)}
                    selectedChildIds={selectedIds}
                    onSelectGroup={handleSelectGroup}
                    copyToClipboard={copyToClipboard}
                />
            );
        }
        return (
            <InventoryGroupRow
                style={style}
                group={rowItem.data}
                isExpanded={rowItem.expanded}
                toggleExpand={() => toggleGroupExpand(rowItem.data.groupKey)}
                selectedChildIds={selectedIds}
                onSelectGroup={handleSelectGroup}
                copyToClipboard={copyToClipboard}
            />
        );
    } else {
        if (isMobile) {
            return (
                <InventoryMobileChildRow
                    item={rowItem.data}
                    style={style}
                    isSelected={isSelected}
                    isAdmin={hasRole('ADMIN')}
                    onSelect={handleSelectRow}
                    onActions={onActions}
                    copyToClipboard={copyToClipboard}
                    isLast={rowItem.isLast}
                />
            );
        }
        return (
            <InventoryChildRow
                style={style}
                item={rowItem.data}
                isSelected={isSelected}
                isAdmin={hasRole('ADMIN')}
                onSelect={handleSelectRow}
                onActions={onActions}
                copyToClipboard={copyToClipboard}
                isLast={rowItem.isLast}
            />
        );
    }
}, areEqual);

// Optimized Virtualized List using react-window
// This replaces NativeList to reduce DOM nodes and memory usage for large lists
const VirtualizedList = ({
    flatList,
    onActions,
    hasRole,
    handleSelectRow,
    toggleGroupExpand,
    selectedIds,
    handleSelectGroup,
    copyToClipboard,
    isMobile
}: {
    flatList: any[];
    onActions: any;
    hasRole: (role: UserRole) => boolean;
    handleSelectRow: (id: string) => void;
    toggleGroupExpand: (key: string) => void;
    selectedIds: Set<string>;
    handleSelectGroup: (groupIds: string[], checked: boolean) => void;
    copyToClipboard: (text: string) => void;
    isMobile: boolean;
}) => {
    const listRef = useRef<VariableSizeList>(null);

    // Force recalculation when flatList changes (e.g. expanding/collapsing)
    useEffect(() => {
        if (listRef.current) {
            listRef.current.resetAfterIndex(0);
        }
    }, [flatList, isMobile]);

    const getItemSize = (index: number) => {
        const item = flatList[index];
        if (isMobile) {
            return item.type === 'GROUP' ? 112 : 128;
        }
        return item.type === 'GROUP' ? 48 : 40;
    };

    const itemData = {
        flatList,
        isMobile,
        selectedIds,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        toggleGroupExpand,
        copyToClipboard,
        hasRole
    };

    return (
        <div style={{ flex: 1, minHeight: 0 }}>
            <AutoSizer>
                {({ height, width }) => (
                    <VariableSizeList
                        ref={listRef}
                        height={height}
                        width={width}
                        itemCount={flatList.length}
                        itemSize={getItemSize}
                        itemData={itemData}
                        overscanCount={5}
                    >
                        {VirtualRow}
                    </VariableSizeList>
                )}
            </AutoSizer>
        </div>
    );
};

interface InventoryListProps {
    flatList: any[];
    isMobile: boolean;
    selectedIds: Set<string>;
    handleSelectGroup: (groupIds: string[], checked: boolean) => void;
    handleSelectRow: (id: string) => void;
    onActions: any;
    toggleGroupExpand: (key: string) => void;
    copyToClipboard: (text: string) => void;
    getCategoryIcon: (cat: string) => string;
    hasRole: (role: UserRole) => boolean;
    onAddNew?: () => void;

    // Header/Footer Stats
    totalGroups: number;
    filteredItemsCount: number;
    hideZeroStock: boolean;
    handleSelectAll: (checked: boolean) => void;

    // List Reset
    expandedGroups: Set<string>;
}

export const InventoryList: React.FC<InventoryListProps> = ({
    flatList,
    isMobile,
    selectedIds,
    handleSelectGroup,
    handleSelectRow,
    onActions,
    toggleGroupExpand,
    copyToClipboard,
    hasRole,
    onAddNew,
    totalGroups,
    filteredItemsCount,
    hideZeroStock,
    handleSelectAll
}) => {

    return (
        <OrbitalCard noPadding className="flex-1 flex flex-col min-h-0 border-orbital-border bg-orbital-bg overflow-visible">
             {!isMobile && (
                 <div className="bg-orbital-surface border-b border-orbital-border py-2 px-4 shadow-sm z-10 sticky top-0">
                    <div className="grid items-center" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                        <div className="flex justify-center">
                            <input
                                type="checkbox"
                                className="accent-orbital-accent w-4 h-4 cursor-pointer"
                                checked={filteredItemsCount > 0 && selectedIds.size === filteredItemsCount}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                        </div>
                        <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-orbital-subtext">PRODUTO / SKU</div>
                        <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-orbital-subtext">CATEGORIA</div>
                        <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-orbital-subtext">LOCAIS</div>
                        <div className="px-2 text-right text-[10px] font-bold uppercase tracking-wider text-orbital-subtext">QTD. TOTAL</div>
                        <div className="px-2 text-right text-[10px] font-bold uppercase tracking-wider text-orbital-subtext">VALIDADE</div>
                        <div className="px-2 text-center text-[10px] font-bold uppercase tracking-wider text-orbital-subtext">STATUS</div>
                        <div />
                    </div>
                 </div>
             )}

             <div className="flex-grow relative bg-orbital-bg flex flex-col">
                {flatList.length > 0 ? (
                    <VirtualizedList
                        flatList={flatList}
                        isMobile={isMobile}
                        onActions={onActions}
                        hasRole={hasRole}
                        handleSelectRow={handleSelectRow}
                        toggleGroupExpand={toggleGroupExpand}
                        selectedIds={selectedIds}
                        handleSelectGroup={handleSelectGroup}
                        copyToClipboard={copyToClipboard}
                    />
                ) : (
                    <EmptyState
                        title="Nenhum item encontrado"
                        description="Tente ajustar os filtros ou adicionar um novo item ao inventário."
                        actionLabel="Adicionar Item"
                        onAction={onAddNew}
                    />
                )}
             </div>

             {!isMobile && (
                 <div className="bg-orbital-surface px-4 py-2 border-t border-orbital-border flex justify-between items-center text-[10px] text-orbital-subtext font-mono uppercase tracking-wide">
                     <span>{totalGroups} Produtos • {filteredItemsCount} Lotes Individuais</span>
                     <span>{hideZeroStock ? 'Ocultando itens sem estoque' : 'Exibindo todos os itens'}</span>
                 </div>
             )}
        </OrbitalCard>
    );
};
