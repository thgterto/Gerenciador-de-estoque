import React, { useEffect, useRef, useCallback } from 'react';
import { OrbitalCard } from '../ui/orbital/OrbitalCard';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { EmptyState } from '../ui/EmptyState';
import {
    InventoryChildRow,
    InventoryGroupRow,
    InventoryMobileGroupRow,
    InventoryMobileChildRow
} from '../InventoryRows';
import { UserRole } from '../../types';

const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

const VirtualRow = ({ index, style, data }: any) => {
    const {
        flatList,
        isMobile,
        selectedIds,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        toggleGroupExpand,
        copyToClipboard,
        hasRole,
        setSize
    } = data;

    const rowItem = flatList[index];
    const isSelected = rowItem.type !== 'GROUP' && selectedIds.has(rowItem.data.id);
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (rowRef.current) {
            setSize(index, rowRef.current.getBoundingClientRect().height);
        }
    }, [setSize, index, rowItem]); // Re-measure if rowItem changes (e.g. expanded state)

    return (
        <div style={style}>
            <div ref={rowRef}>
                {rowItem.type === 'GROUP' ? (
                    isMobile ? (
                        <InventoryMobileGroupRow
                            group={rowItem.data}
                            style={{ width: '100%' }}
                            isExpanded={rowItem.expanded}
                            toggleExpand={() => toggleGroupExpand(rowItem.data.groupKey)}
                            selectedChildIds={selectedIds}
                            onSelectGroup={handleSelectGroup}
                            copyToClipboard={copyToClipboard}
                        />
                    ) : (
                        <InventoryGroupRow
                            group={rowItem.data}
                            style={{ width: '100%' }}
                            isExpanded={rowItem.expanded}
                            toggleExpand={() => toggleGroupExpand(rowItem.data.groupKey)}
                            selectedChildIds={selectedIds}
                            onSelectGroup={handleSelectGroup}
                            copyToClipboard={copyToClipboard}
                        />
                    )
                ) : (
                    isMobile ? (
                        <InventoryMobileChildRow
                            item={rowItem.data}
                            style={{ width: '100%' }}
                            isSelected={isSelected}
                            isAdmin={hasRole('ADMIN')}
                            onSelect={handleSelectRow}
                            onActions={onActions}
                            copyToClipboard={copyToClipboard}
                            isLast={rowItem.isLast}
                        />
                    ) : (
                        <InventoryChildRow
                            item={rowItem.data}
                            style={{ width: '100%' }}
                            isSelected={isSelected}
                            isAdmin={hasRole('ADMIN')}
                            onSelect={handleSelectRow}
                            onActions={onActions}
                            copyToClipboard={copyToClipboard}
                            isLast={rowItem.isLast}
                        />
                    )
                )}
            </div>
        </div>
    );
};

// Virtual List Component (Handles both Desktop and Mobile via React Window)
const VirtualList = ({
    flatList,
    onActions,
    hasRole,
    handleSelectRow,
    toggleGroupExpand,
    selectedIds,
    handleSelectGroup,
    copyToClipboard,
    isMobile
}: any) => {
    const sizeMap = useRef<{ [key: number]: number }>({});
    const listRef = useRef<List>(null);

    const setSize = useCallback((index: number, size: number) => {
        sizeMap.current = { ...sizeMap.current, [index]: size };
        if (listRef.current) {
            listRef.current.resetAfterIndex(index);
        }
    }, []);

    const getSize = (index: number) => sizeMap.current[index] || (isMobile ? 120 : 50);

    const itemData = {
        flatList,
        isMobile,
        selectedIds,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        toggleGroupExpand,
        copyToClipboard,
        hasRole,
        setSize
    };

    return (
        <div className="w-full h-full pb-24">
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        height={height}
                        itemCount={flatList.length}
                        itemSize={getSize}
                        width={width}
                        itemData={itemData}
                        overscanCount={5}
                    >
                        {VirtualRow}
                    </List>
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

             <div className="flex-grow relative bg-orbital-bg">
                {flatList.length > 0 ? (
                    <VirtualList
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
