import React, { useEffect, useState } from 'react';
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

const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

// Native List Component (Handles both Desktop and Mobile via Native Scroll + Pagination)
const NativeList = ({
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
    const [visibleCount, setVisibleCount] = useState(50);

    // Reset visible count when list changes significantly (e.g. filters)
    useEffect(() => {
        // eslint-disable-next-line
        setVisibleCount(50);
    }, [flatList.length]);

    const visibleItems = flatList.slice(0, visibleCount);

    return (
        <div className="pb-24">
            {visibleItems.map((rowItem: any, index: number) => {
                const isSelected = rowItem.type !== 'GROUP' && selectedIds.has(rowItem.data.id);
                const style = { width: '100%' };

                if (rowItem.type === 'GROUP') {
                    if (isMobile) {
                        return (
                            <InventoryMobileGroupRow
                                key={rowItem.data.groupKey || index}
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
                            key={rowItem.data.groupKey || index}
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
                                key={rowItem.data.id || index}
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
                            key={rowItem.data.id || index}
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
            })}

            {visibleCount < flatList.length && (
                <div className="p-4 flex justify-center">
                    <OrbitalButton
                        variant="outline"
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        className="w-full sm:w-auto"
                    >
                        Carregar Mais ({flatList.length - visibleCount} restantes)
                    </OrbitalButton>
                </div>
            )}
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
                    <NativeList
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
