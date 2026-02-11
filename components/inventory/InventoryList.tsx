import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import { Card, Box, Checkbox, Typography, Button } from '@mui/material';
import { EmptyState } from '../ui/EmptyState';
import {
    InventoryChildRow,
    InventoryGroupRow,
    InventoryMobileGroupRow,
    InventoryMobileChildRow
} from '../InventoryRows';
import { VariableSizeList } from 'react-window';
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

// Mobile Native List Component
const MobileNativeList = ({
    flatList,
    onActions,
    hasRole,
    handleSelectRow,
    toggleGroupExpand,
    selectedIds,
    handleSelectGroup,
    getCategoryIcon,
    copyToClipboard
}: any) => {
    const [visibleCount, setVisibleCount] = useState(50);

    // Reset visible count when list changes significantly (e.g. filters)
    useEffect(() => {
        setVisibleCount(50);
    }, [flatList.length]);

    const visibleItems = flatList.slice(0, visibleCount);

    return (
        <Box sx={{ pb: 10 }}>
            {visibleItems.map((rowItem: any) => {
                const isSelected = rowItem.type !== 'GROUP' && selectedIds.has(rowItem.data.id);

                // Wrapper style to simulate the list
                const style = { width: '100%' };

                if (rowItem.type === 'GROUP') {
                    return (
                        <InventoryMobileGroupRow
                            key={rowItem.data.groupKey}
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
                } else {
                    return (
                        <InventoryMobileChildRow
                            key={rowItem.data.id}
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
            })}

            {visibleCount < flatList.length && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        fullWidth
                    >
                        Carregar Mais ({flatList.length - visibleCount} restantes)
                    </Button>
                </Box>
            )}
        </Box>
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
        // Note: Mobile size not used in variable list anymore, but kept for logic safety
        return item.type === 'GROUP' ? 64 : 48;
    }, [flatList]);

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
                    isMobile ? (
                        /* Mobile: Native Scroll List with Pagination */
                        <MobileNativeList
                            flatList={flatList}
                            onActions={onActions}
                            hasRole={hasRole}
                            handleSelectRow={handleSelectRow}
                            toggleGroupExpand={toggleGroupExpand}
                            selectedIds={selectedIds}
                            handleSelectGroup={handleSelectGroup}
                            getCategoryIcon={getCategoryIcon}
                            copyToClipboard={copyToClipboard}
                        />
                    ) : (
                        /* Desktop: Virtualized List */
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
                                >
                                    {InventoryRow}
                                </VariableSizeList>
                            )}
                        </AutoSizer>
                    )
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
