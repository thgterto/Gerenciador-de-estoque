import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import { Card, Box, Checkbox, Typography } from '@mui/material';
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

// Custom comparison to prevent re-rendering ALL rows when just one is selected
const arePropsEqual = (prevProps: any, nextProps: any) => {
    const { index: prevIndex, style: prevStyle, data: prevData } = prevProps;
    const { index: nextIndex, style: nextStyle, data: nextData } = nextProps;

    if (prevIndex !== nextIndex) return false;

    // Style check (shallow compare)
    if (prevStyle !== nextStyle) {
        if (prevStyle.height !== nextStyle.height ||
            prevStyle.width !== nextStyle.width ||
            prevStyle.top !== nextStyle.top ||
            prevStyle.left !== nextStyle.left) {
            return false;
        }
    }

    // Data reference check
    if (prevData === nextData) return true;

    // Specific data checks
    if (prevData.isMobile !== nextData.isMobile) return false;

    // Check if flatList item changed
    if (prevData.flatList !== nextData.flatList) {
        const prevItem = prevData.flatList[prevIndex];
        const nextItem = nextData.flatList[nextIndex];
        // If the item itself changed (e.g. expansion, or filtered list changed content at this index)
        if (prevItem !== nextItem) return false;
    }

    // Check Selection
    const item = nextData.flatList[nextIndex];
    if (item && !nextData.isMobile) {
        if (item.type === 'GROUP') {
             if (prevData.selectedIds !== nextData.selectedIds) {
                 const groupItems = item.data.items;
                 for (const child of groupItems) {
                     if (prevData.selectedIds.has(child.id) !== nextData.selectedIds.has(child.id)) {
                         return false;
                     }
                 }
             }
        } else {
            const id = item.data.id;
            if (prevData.selectedIds.has(id) !== nextData.selectedIds.has(id)) return false;
        }
    }

    return true;
};

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
}, arePropsEqual);

interface InventoryListProps {
    flatList: any[];
    isMobile: boolean;
    useNativeScroll?: boolean;
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
    expandedGroups,
    useNativeScroll = false
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

    if (useNativeScroll) {
        return (
            <Box sx={{ pb: 10 }}>
                {flatList.length > 0 ? (
                    flatList.map((_item, index) => (
                        <InventoryRow
                            key={itemKey(index)}
                            index={index}
                            style={{}}
                            data={itemData}
                        />
                    ))
                ) : (
                    <EmptyState
                        title="Nenhum item encontrado"
                        description="Tente ajustar os filtros ou adicionar um novo item ao inventário."
                        actionLabel="Adicionar Item"
                        onAction={onAddNew}
                    />
                )}
            </Box>
        );
    }

    return (
        <Card
            elevation={0}
            sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                border: isMobile ? 'none' : 1,
                borderColor: 'divider',
                bgcolor: isMobile ? 'transparent' : 'background.paper'
            }}
        >
             {!isMobile && (
                 <Box sx={{
                     bgcolor: 'background.default',
                     borderBottom: 1,
                     borderColor: 'divider',
                     py: 1.5
                 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: GRID_TEMPLATE, px: 2, alignItems: 'center' }}>
                        <Box display="flex" justifyContent="center">
                            <Checkbox
                                size="small"
                                checked={filteredItemsCount > 0 && selectedIds.size === filteredItemsCount}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                        </Box>
                        <Box px={1}><Typography variant="caption" fontWeight="bold">PRODUTO / SKU</Typography></Box>
                        <Box px={1}><Typography variant="caption" fontWeight="bold">CATEGORIA</Typography></Box>
                        <Box px={1}><Typography variant="caption" fontWeight="bold">LOCAIS</Typography></Box>
                        <Box px={1} textAlign="right"><Typography variant="caption" fontWeight="bold">QTD. TOTAL</Typography></Box>
                        <Box px={1} textAlign="right"><Typography variant="caption" fontWeight="bold">VALIDADE</Typography></Box>
                        <Box px={1} textAlign="center"><Typography variant="caption" fontWeight="bold">STATUS</Typography></Box>
                        <Box />
                    </Box>
                 </Box>
             )}

             <Box sx={{ flexGrow: 1, position: 'relative' }}>
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
             </Box>

             {!isMobile && (
                 <Box sx={{ bgcolor: 'background.default', px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                     <Typography variant="caption" color="text.secondary">{totalGroups} Produtos • {filteredItemsCount} Lotes Individuais</Typography>
                     <Typography variant="caption" color="text.secondary">{hideZeroStock ? 'Ocultando itens sem estoque' : 'Exibindo todos os itens'}</Typography>
                 </Box>
             )}
        </Card>
    );
};
