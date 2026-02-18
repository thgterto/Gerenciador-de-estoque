import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import { VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { UserRole } from '../../../types';
import { OrbitalInventoryGroupRow, OrbitalInventoryChildRow } from './OrbitalInventoryRows';
import { OrbitalButton } from '../../ui/orbital/OrbitalButton';

// Custom comparison
const arePropsEqual = (prevProps: any, nextProps: any) => {
    const { index: prevIndex, style: prevStyle, data: prevData } = prevProps;
    const { index: nextIndex, style: nextStyle, data: nextData } = nextProps;

    if (prevIndex !== nextIndex) return false;
    if (prevStyle.height !== nextStyle.height) return false;
    if (prevData === nextData) return true;
    if (prevData.flatList !== nextData.flatList) {
        if (prevData.flatList[prevIndex] !== nextData.flatList[nextIndex]) return false;
    }

    // Selection check
    const item = nextData.flatList[nextIndex];
    if (item && item.type === 'GROUP') {
         // Deep check for group selection state would be expensive here, rely on parent re-render or context?
         // For now, let's assume if selectedIds changed, we might need to re-render.
         if (prevData.selectedIds !== nextData.selectedIds) return false;
    } else if (item) {
        if (prevData.selectedIds.has(item.data.id) !== nextData.selectedIds.has(item.data.id)) return false;
    }

    return true;
};

const OrbitalInventoryRow = React.memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
    const {
        flatList,
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
        return (
            <OrbitalInventoryGroupRow
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
        return (
            <OrbitalInventoryChildRow
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
}, arePropsEqual);

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
    totalGroups: number;
    filteredItemsCount: number;
    hideZeroStock: boolean;
    handleSelectAll: (checked: boolean) => void;
    expandedGroups: Set<string>;
}

const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

export const OrbitalInventoryList: React.FC<InventoryListProps> = ({
    flatList,
    isMobile: _isMobile,
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
    }, [flatList, expandedGroups]);

    const getItemSize = useCallback((index: number) => {
        const item = flatList[index];
        return item.type === 'GROUP' ? 56 : 48; // Adjusted heights for new row design
    }, [flatList]);

    const itemKey = useCallback((index: number) => flatList[index]?.id || index, [flatList]);

    const itemData = useMemo(() => ({
        flatList,
        selectedIds,
        handleSelectGroup,
        handleSelectRow,
        onActions,
        toggleGroupExpand,
        copyToClipboard,
        getCategoryIcon,
        hasRole
    }), [flatList, selectedIds, handleSelectGroup, handleSelectRow, onActions, toggleGroupExpand, copyToClipboard, getCategoryIcon, hasRole]);

    return (
        <div className="flex flex-col flex-grow min-h-0 border border-orbital-border bg-orbital-card rounded-sm overflow-hidden shadow-orbital">
             {/* Header */}
             <div className="bg-orbital-bg border-b border-orbital-border py-3">
                <div style={{ display: 'grid', gridTemplateColumns: GRID_TEMPLATE }} className="px-4 items-center">
                    <div className="flex justify-center">
                        <input
                            type="checkbox"
                            checked={filteredItemsCount > 0 && selectedIds.size === filteredItemsCount}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orbital-primary focus:ring-orbital-primary focus:ring-offset-gray-900"
                        />
                    </div>
                    <div className="px-2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Produto / SKU</div>
                    <div className="px-2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Categoria</div>
                    <div className="px-2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Locais</div>
                    <div className="px-2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider text-right">Qtd. Total</div>
                    <div className="px-2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider text-right">Validade</div>
                    <div className="px-2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider text-center">Status</div>
                    <div />
                </div>
             </div>

             {/* List Area */}
             <div className="flex-grow relative bg-orbital-bg/50">
                {flatList.length > 0 ? (
                    <AutoSizer>
                        {({ height, width }: { height: number; width: number }) => (
                            <VariableSizeList
                                ref={listRef}
                                height={height}
                                itemCount={flatList.length}
                                itemSize={getItemSize}
                                itemKey={itemKey}
                                width={width}
                                itemData={itemData}
                                className="custom-scrollbar"
                            >
                                {OrbitalInventoryRow}
                            </VariableSizeList>
                        )}
                    </AutoSizer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                        <div className="w-16 h-16 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center">
                            <span className="font-mono text-2xl font-bold opacity-50">0</span>
                        </div>
                        <p className="font-mono text-sm uppercase tracking-wide">Nenhum item localizado</p>
                        {onAddNew && (
                            <OrbitalButton onClick={onAddNew} size="sm" variant="primary">
                                Inicializar Novo Protocolo
                            </OrbitalButton>
                        )}
                    </div>
                )}
             </div>

             {/* Footer Status Bar */}
             <div className="bg-orbital-bg border-t border-orbital-border px-4 py-2 flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                 <div>
                    <span className="text-white font-bold">{totalGroups}</span> Produtos Identificados • <span className="text-white font-bold">{filteredItemsCount}</span> Lotes Individuais
                 </div>
                 <div>
                    {hideZeroStock ? '[FILTRO] Ocultando Estoque Zero' : '[VISUALIZAÇÃO] Completa'}
                 </div>
             </div>
        </div>
    );
};
