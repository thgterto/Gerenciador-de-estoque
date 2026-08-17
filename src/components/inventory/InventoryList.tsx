import React, { useMemo } from 'react';
import { VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { OrbitalCard } from '../ui/orbital/OrbitalCard';
import { EmptyState } from '../ui/EmptyState';
import {
    InventoryChildRow,
    InventoryGroupRow,
    InventoryMobileGroupRow,
    InventoryMobileChildRow
} from '../InventoryRows';
import { UserRole } from '../../types';


const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

const VirtualizedRow = React.memo(({ data, index, style }: any) => {
    const {
        flatList,
        isMobile,
        selectedIds,
        toggleGroupExpand,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        copyToClipboard,
        hasRole
    } = data;

    const rowItem = flatList[index];
    const isSelected = rowItem.type !== 'GROUP' && selectedIds.has(rowItem.data.id);

    // We adjust style slightly so elements render correctly inside react-window's absolute positioning container
    const rowStyle = { ...style, width: '100%' };

    if (rowItem.type === 'GROUP') {
        if (isMobile) {
            return (
                <InventoryMobileGroupRow
                    key={rowItem.data.groupKey || index}
                    group={rowItem.data}
                    style={rowStyle}
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
                key={rowItem.data.groupKey || index}
                style={rowStyle}
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
                    key={rowItem.data.id || index}
                    item={rowItem.data}
                    style={rowStyle}
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
                key={rowItem.data.id || index}
                style={rowStyle}
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
    hasRole,
    onAddNew,
    totalGroups,
    filteredItemsCount,
    hideZeroStock,
    handleSelectAll
}) => {

    const itemData = useMemo(() => ({
        flatList,
        isMobile,
        selectedIds,
        toggleGroupExpand,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        copyToClipboard,
        hasRole
    }), [
        flatList,
        isMobile,
        selectedIds,
        toggleGroupExpand,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        copyToClipboard,
        hasRole
    ]);

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

             <div className="flex-grow relative bg-orbital-bg pb-24">
                {flatList.length > 0 ? (
                    <AutoSizer>
                        {({ height, width }) => (
                            <VariableSizeList
                                height={height}
                                width={width}
                                itemCount={flatList.length}
                                itemSize={(index) => {
                                    const rowItem = flatList[index];
                                    if (rowItem.type === 'GROUP') {
                                        return isMobile ? 120 : 48; // Group row heights
                                    }
                                    return isMobile ? 180 : 56; // Child row heights
                                }}
                                itemData={itemData}
                                overscanCount={5}
                            >
                                {VirtualizedRow}
                            </VariableSizeList>
                        )}
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
                 <div className="bg-orbital-surface px-4 py-2 border-t border-orbital-border flex justify-between items-center text-[10px] text-orbital-subtext font-mono uppercase tracking-wide">
                     <span>{totalGroups} Produtos • {filteredItemsCount} Lotes Individuais</span>
                     <span>{hideZeroStock ? 'Ocultando itens sem estoque' : 'Exibindo todos os itens'}</span>
                 </div>
             )}
        </OrbitalCard>
    );
};
