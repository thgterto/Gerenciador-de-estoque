

import { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { getItemStatus, ItemStatusResult } from '../utils/businessRules';
import { normalizeStr, defaultCollator } from '../utils/stringUtils';
import { useDebounce } from './useDebounce';

export type StatusFilterType = 'ALL' | 'EXPIRED' | 'LOW_STOCK' | 'OK';

export interface InventoryGroup {
    id: string;
    groupKey: string; 
    primaryItem: InventoryItem; 
    totalQuantity: number;
    items: InventoryItem[]; 
    statusPriority: number; 
    aggregatedStatus: ItemStatusResult;
    locations: string[];
}

export type FlatListItem = 
  | { type: 'GROUP'; id: string; data: InventoryGroup; expanded: boolean }
  | { type: 'ITEM'; id: string; data: InventoryItem; isLast: boolean };

export const useInventoryFilters = (items: InventoryItem[]) => {
    const [term, setTerm] = useState('');
    const debouncedTerm = useDebounce(term, 300);
    const [catFilter, setCatFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
    const [hideZeroStock, setHideZeroStock] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // --- 1. Pré-processamento de Filtros Base (Rápido) ---
    // Filtra primeiro por categorias/status que são comparadores diretos
    const baseFilteredItems = useMemo(() => {
        if (!catFilter && !locationFilter && statusFilter === 'ALL' && !hideZeroStock) return items;

        const now = Date.now(); // Optimization: Use timestamp
        return items.filter(i => {
            // Filtro de Estoque Zero
            if (hideZeroStock && (i.quantity || 0) <= 0) return false;

            // Filtros Categóricos
            if (catFilter && i.category !== catFilter) return false;
            if (locationFilter && i.location.warehouse !== locationFilter) return false;

            // Filtro de Status
            if (statusFilter !== 'ALL') {
                const status = getItemStatus(i, now);
                if (statusFilter === 'EXPIRED' && !status.isExpired) return false;
                if (statusFilter === 'LOW_STOCK' && !status.isLowStock) return false;
                if (statusFilter === 'OK' && (status.isExpired || status.isLowStock)) return false;
            }
            return true;
        });
    }, [items, catFilter, locationFilter, statusFilter, hideZeroStock]);

    // --- 2. Busca Textual (Pesado - Debounced) ---
    // Separamos isso para que mudanças de filtro não esperem o debounce, e busca não trave a UI
    const finalFilteredItems = useMemo(() => {
        if (!debouncedTerm) return baseFilteredItems;

        const terms = debouncedTerm.trim().split(/\s+/).filter(t => t.length > 0);
        const normalizedTerms = terms.map(t => normalizeStr(t));

        if (normalizedTerms.length === 0) return baseFilteredItems;

        return baseFilteredItems.filter(i => {
            const itemStr = normalizeStr(`${i.name} ${i.sapCode} ${i.lotNumber} ${i.casNumber || ''}`);
            return normalizedTerms.every(t => itemStr.includes(t));
        });
    }, [baseFilteredItems, debouncedTerm]);

    // --- 3. Agrupamento (Transformação de Dados) ---
    const groupedInventory = useMemo(() => {
        const groups: Record<string, InventoryGroup> = {};
  
        for (const item of finalFilteredItems) {
            // Agrupa por SAP ou Nome
            const groupKey = item.sapCode && item.sapCode.length > 3 && item.sapCode !== 'S/ SAP' 
                ? item.sapCode 
                : item.name.trim();
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    id: `grp-${groupKey}`, 
                    groupKey,
                    primaryItem: item,
                    totalQuantity: 0,
                    items: [],
                    statusPriority: 0,
                    aggregatedStatus: getItemStatus(item),
                    locations: []
                };
            }
  
            const grp = groups[groupKey];
            grp.items.push(item);
            grp.totalQuantity += item.quantity;
            
            const locName = item.location.warehouse || 'Geral';
            if (!grp.locations.includes(locName)) grp.locations.push(locName);
        }
  
        // Processa Status Agregado e Ordenação
        const now = Date.now(); // Optimization: Use timestamp
        const result = Object.values(groups).map(grp => {
            let hasExpired = false;
            let hasLowStock = false;
            
            // Verifica status de todos os filhos para resumir o pai
            for (const i of grp.items) {
                const s = getItemStatus(i, now);
                if (s.isExpired) hasExpired = true;
                if (s.isLowStock) hasLowStock = true;
                if (hasExpired && hasLowStock) break;
            }
  
            if (hasExpired) {
                grp.aggregatedStatus = { isExpired: true, isLowStock: false, status: 'EXPIRED', label: 'Contém Vencidos', variant: 'danger', icon: 'event_busy' };
                grp.statusPriority = 3;
            } else if (hasLowStock && grp.totalQuantity <= grp.primaryItem.minStockLevel) {
                grp.aggregatedStatus = { isExpired: false, isLowStock: true, status: 'LOW_STOCK', label: 'Repor Estoque', variant: 'warning', icon: 'warning' };
                grp.statusPriority = 2;
            } else {
                grp.aggregatedStatus = { isExpired: false, isLowStock: false, status: 'OK', label: 'Regular', variant: 'success', icon: 'check_circle' };
                grp.statusPriority = 1;
            }
            
            return grp;
        });

        // Ordenação final (Prioridade de status > Alfabética)
        // Optimization: Replaced localeCompare with shared Intl.Collator (~2x faster)
        return result.sort((a, b) => {
            if (b.statusPriority !== a.statusPriority) return b.statusPriority - a.statusPriority;
            return defaultCollator.compare(a.primaryItem.name, b.primaryItem.name);
        });
  
    }, [finalFilteredItems]);

    // --- 4. Virtualização (Flat List) ---
    const flatList = useMemo<FlatListItem[]>(() => {
        const flat: FlatListItem[] = [];
        groupedInventory.forEach(group => {
            const isExpanded = expandedGroups.has(group.groupKey);
            flat.push({ type: 'GROUP', id: group.id, data: group, expanded: isExpanded });
            
            if (isExpanded) {
                group.items.forEach((item, index) => {
                    flat.push({ 
                        type: 'ITEM', 
                        id: item.id,
                        data: item,
                        isLast: index === group.items.length - 1
                    });
                });
            }
        });
        return flat;
    }, [groupedInventory, expandedGroups]);

    // --- 5. Metadados para Filtros de UI (Calculado apenas sobre items totais) ---
    const uniqueLocations = useMemo(() => 
        Array.from(new Set(items.map(i => i.location.warehouse))).filter(Boolean).sort(), 
    [items]);
    
    const uniqueCategories = useMemo(() => {
        const cats = new Set(items.map(i => i.category).filter(Boolean));
        return ['', ...Array.from(cats).sort()];
    }, [items]);

    const stats = useMemo(() => {
        let expired = 0;
        let low = 0;
        const now = Date.now(); // Optimization: Use timestamp
        items.forEach(i => {
            const status = getItemStatus(i, now);
            if (status.isExpired) expired++;
            if (status.isLowStock) low++;
        });
        return { lowStockCount: low, expiredCount: expired, totalItems: items.length };
    }, [items]);

    const toggleGroupExpand = (groupKey: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupKey)) newSet.delete(groupKey);
            else newSet.add(groupKey);
            return newSet;
        });
    };

    return {
        term, setTerm,
        catFilter, setCatFilter,
        locationFilter, setLocationFilter,
        statusFilter, setStatusFilter,
        hideZeroStock, setHideZeroStock,
        filteredItems: finalFilteredItems,
        flatList,
        uniqueLocations,
        uniqueCategories,
        stats,
        toggleGroupExpand,
        expandedGroups,
        totalGroups: groupedInventory.length
    };
};
