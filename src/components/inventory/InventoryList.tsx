import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { OrbitalCard } from '../ui/orbital/OrbitalCard';
import { EmptyState } from '../ui/EmptyState';
import {
    InventoryChildRow,
    InventoryGroupRow,
    InventoryMobileGroupRow,
    InventoryMobileChildRow
} from '../InventoryRows';
import { UserRole } from '../../types';
import { OrbitalButton } from '../ui/orbital/OrbitalButton';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

// Virtualized Row Component
const VirtualizedRow = ({ index, style, data }: any) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const {
        flatList,
        isMobile,
        selectedIds,
        hasRole,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        toggleGroupExpand,
        copyToClipboard,
        setRowHeight
    } = data;

    const rowItem = flatList[index];

    useLayoutEffect(() => {
        if (rowRef.current) {
            setRowHeight(index, rowRef.current.getBoundingClientRect().height);
        }
    }, [index, setRowHeight, rowItem, isMobile]);

    const isSelected = rowItem.type !== 'GROUP' && selectedIds.has(rowItem.data.id);

    // We pass the style down but omit the absolute position from the inner div
    // to allow it to size naturally for measurement, while the container applies style

    let content = null;

    if (rowItem.type === 'GROUP') {
        if (isMobile) {
            content = (
                <InventoryMobileGroupRow
                    key={rowItem.data.groupKey || index}
                    group={rowItem.data}
                    style={{ width: '100%' }}
                    isExpanded={rowItem.expanded}
                    toggleExpand={() => toggleGroupExpand(rowItem.data.groupKey)}
                    selectedChildIds={selectedIds}
                    onSelectGroup={handleSelectGroup}
                    copyToClipboard={copyToClipboard}
                />
            );
        } else {
            content = (
                 <InventoryGroupRow
                    key={rowItem.data.groupKey || index}
                    style={{ width: '100%' }}
                    group={rowItem.data}
                    isExpanded={rowItem.expanded}
                    toggleExpand={() => toggleGroupExpand(rowItem.data.groupKey)}
                    selectedChildIds={selectedIds}
                    onSelectGroup={handleSelectGroup}
                    copyToClipboard={copyToClipboard}
                />
            );
        }
    } else {
         if (isMobile) {
            content = (
                <InventoryMobileChildRow
                    key={rowItem.data.id || index}
                    item={rowItem.data}
                    style={{ width: '100%' }}
                    isSelected={isSelected}
                    isAdmin={hasRole('ADMIN')}
                    onSelect={handleSelectRow}
                    onActions={onActions}
                    copyToClipboard={copyToClipboard}
                    isLast={rowItem.isLast}
                />
            );
        } else {
            content = (
                <InventoryChildRow
                    key={rowItem.data.id || index}
                    style={{ width: '100%' }}
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
    }

    return (
        <div style={style}>
            <div ref={rowRef}>
                {content}
            </div>
        </div>
    );
};

// Virtualized List Component
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
    const listRef = useRef<List>(null);
    const rowHeights = useRef<Record<number, number>>({});

    const setRowHeight = React.useCallback((index: number, size: number) => {
        if (rowHeights.current[index] !== size) {
            rowHeights.current[index] = size;
            if (listRef.current) {
                listRef.current.resetAfterIndex(index);
            }
        }
    }, []);

    const getItemSize = (index: number) => {
        return rowHeights.current[index] || (isMobile ? 100 : 50);
    };

    const itemData = {
        flatList,
        isMobile,
        selectedIds,
        hasRole,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        toggleGroupExpand,
        copyToClipboard,
        setRowHeight
    };

    return (
        <div className="h-full w-full pb-24">
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        height={height}
                        width={width}
                        itemCount={flatList.length}
                        itemSize={getItemSize}
                        itemData={itemData}
                        overscanCount={5}
                    >
                        {VirtualizedRow}
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
