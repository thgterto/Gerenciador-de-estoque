import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import {
    InventoryChildRow,
    InventoryGroupRow,
    InventoryMobileGroupRow,
    InventoryMobileChildRow
} from '../InventoryRows';
import { VariableSizeList, FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { UserRole } from '../../types';

const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

// Row Component
const InventoryRow = React.memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
    const {
        flatList,
        isMobile,
        selectedIds,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        toggleGroupExpand,
        copyToClipboard,
        getCategoryIcon,
        hasRole
    } = data;

    const rowItem = flatList[index];
    if (!rowItem) return null;

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
                  getCategoryIcon={getCategoryIcon}
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
                getCategoryIcon={getCategoryIcon}
                copyToClipboard={copyToClipboard}
            />
        );
    } else {
        const isSelected = selectedIds.has(rowItem.data.id);

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
});

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
    getCategoryIcon,
    hasRole,
    onAddNew,
    totalGroups,
    filteredItemsCount,
    hideZeroStock,
    handleSelectAll,
    expandedGroups
}) => {
    const listRef = useRef<any>(null);

    useEffect(() => {
        if (listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(0);
        }
    }, [isMobile, flatList, expandedGroups]);

    const getItemSize = useCallback((index: number) => {
        const item = flatList[index];
        if (isMobile) {
            if (item.type === 'GROUP') return item.expanded ? 110 : 100;
            return 130;
        }
        return item.type === 'GROUP' ? 64 : 48;
    }, [flatList, isMobile]);

    const itemKey = useCallback((index: number) => flatList[index]?.id || index, [flatList]);

    const itemData = useMemo(() => ({
        flatList,
        isMobile,
        selectedIds,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        toggleGroupExpand,
        copyToClipboard,
        getCategoryIcon,
        hasRole
    }), [flatList, isMobile, selectedIds, handleSelectGroup, handleSelectRow, onActions, toggleGroupExpand, copyToClipboard, getCategoryIcon, hasRole]);

    return (
        <Card padding="p-0" className={`flex-1 min-h-0 flex flex-col ${isMobile ? 'bg-transparent border-none shadow-none' : 'bg-surface-light dark:bg-surface-dark'} relative overflow-hidden`}>
             {!isMobile && (
                 <div className="bg-background-light dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-slate-400 shrink-0 z-10">
                    <div className="grid items-center px-4" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                        <div className="flex items-center justify-center">
                            <input
                                className="w-4 h-4 text-primary bg-surface-light dark:bg-slate-800 border-border-light dark:border-border-dark rounded focus:ring-primary cursor-pointer transition-colors"
                                type="checkbox"
                                checked={filteredItemsCount > 0 && selectedIds.size === filteredItemsCount}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                        </div>
                        <div className="px-2 py-3">Produto / SKU</div>
                        <div className="px-2 py-3">Categoria</div>
                        <div className="px-2 py-3">Locais</div>
                        <div className="px-2 py-3 text-right">Qtd. Total</div>
                        <div className="px-2 py-3 text-right">Validade</div>
                        <div className="px-2 py-3 text-center">Status</div>
                        <div className="px-2 py-3 text-right"></div>
                    </div>
                 </div>
             )}

             <div className="flex-1 w-full relative">
                {flatList.length > 0 ? (
                    <AutoSizer>
                        {({ height, width }: { height: number; width: number }) => {
                            if (isMobile) {
                                return (
                                    <FixedSizeList
                                        ref={listRef}
                                        height={height}
                                        itemCount={flatList.length}
                                        itemSize={130}
                                        itemKey={itemKey}
                                        width={width}
                                        className="custom-scrollbar overflow-y-auto"
                                        itemData={itemData}
                                    >
                                        {InventoryRow}
                                    </FixedSizeList>
                                );
                            }
                            return (
                                <VariableSizeList
                                    ref={listRef}
                                    height={height}
                                    itemCount={flatList.length}
                                    itemSize={getItemSize}
                                    itemKey={itemKey}
                                    width={width}
                                    className="custom-scrollbar overflow-y-auto"
                                    itemData={itemData}
                                >
                                    {InventoryRow}
                                </VariableSizeList>
                            );
                        }}
                    </AutoSizer>
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
                 <div className="bg-background-light dark:bg-slate-800/50 px-6 py-3 border-t border-border-light dark:border-border-dark text-xs text-text-secondary dark:text-slate-400 flex justify-between shrink-0 font-medium">
                     <span>{totalGroups} Produtos • {filteredItemsCount} Lotes Individuais</span>
                     <span>{hideZeroStock ? 'Ocultando itens sem estoque' : 'Exibindo todos os itens'}</span>
                 </div>
             )}
        </Card>
    );
};
