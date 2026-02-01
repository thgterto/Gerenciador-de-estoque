import React, { useState, useCallback, useEffect } from 'react';
import { InventoryItem } from '../types';
import { Button } from './ui/Button';
import { PageHeader } from './ui/PageHeader';
import { PageContainer } from './ui/PageContainer';
import { useAuth } from '../context/AuthContext';
import { useStockOperations } from '../hooks/useStockOperations';
import { useInventoryFilters } from '../hooks/useInventoryFilters';

import { InventoryKPIs } from './inventory/InventoryKPIs';
import { InventoryFilters } from './inventory/InventoryFilters';
import { InventoryList } from './inventory/InventoryList';

interface Props {
  items: InventoryItem[];
  onActions: {
    edit: (item: InventoryItem) => void;
    move: (item: InventoryItem) => void;
    delete: (id: string, name: string) => void;
    request: () => void;
    qr: (item: InventoryItem) => void;
    viewHistory: (item: InventoryItem) => void;
    clone: (item: InventoryItem) => void; 
  };
  onAddNew?: () => void;
}

export const InventoryTable: React.FC<Props> = ({ items, onActions, onAddNew }) => {
  const { hasRole } = useAuth();
  const { deleteManyItems } = useStockOperations();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
      term, setTerm,
      catFilter, setCatFilter,
      locationFilter, setLocationFilter,
      statusFilter, setStatusFilter,
      hideZeroStock, setHideZeroStock,
      filteredItems,
      flatList,
      uniqueLocations,
      uniqueCategories,
      stats,
      toggleGroupExpand,
      expandedGroups,
      totalGroups
  } = useInventoryFilters(items);

  const handleSelectAll = useCallback((checked: boolean) => {
      if (checked) {
          const allIds = new Set(filteredItems.map(i => i.id));
          setSelectedIds(allIds);
      } else {
          setSelectedIds(new Set());
      }
  }, [filteredItems]);

  const handleSelectGroup = useCallback((groupIds: string[], checked: boolean) => {
      setSelectedIds(prev => {
          const newSet = new Set(prev);
          groupIds.forEach(id => {
              if (checked) newSet.add(id);
              else newSet.delete(id);
          });
          return newSet;
      });
  }, []);

  const handleSelectRow = useCallback((id: string) => {
      setSelectedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          return newSet;
      });
  }, []);
  
  const handleBulkDelete = async () => {
      if (selectedIds.size === 0) return;
      const success = await deleteManyItems(Array.from(selectedIds));
      if (success) setSelectedIds(new Set());
  };

  const getCategoryIcon = useCallback((cat: string) => {
      const c = cat.toLowerCase();
      if (c.includes('reagente') || c.includes('quimico')) return 'science';
      if (c.includes('vidraria')) return 'biotech';
      if (c.includes('equipamento')) return 'memory';
      if (c.includes('peça') || c.includes('manutencao')) return 'build';
      if (c.includes('consum')) return 'inventory';
      return 'inventory_2'; 
  }, []);

  const copyToClipboard = useCallback((text: string) => {
      if(!text) return;
      navigator.clipboard.writeText(text);
  }, []);

  return (
    <PageContainer>
        <PageHeader 
            title="Inventário" 
            description="Gerencie lotes, reagentes e vidrarias."
            className="mb-4"
        >
            <Button variant="white" icon="file_download" onClick={() => alert("Use o menu de Configurações para exportar dados completos.")} className="hidden sm:flex">
                Exportar
            </Button>
            {onAddNew && (
                <Button variant="primary" icon="add" onClick={onAddNew}>
                    Adicionar
                </Button>
            )}
        </PageHeader>

        <InventoryKPIs stats={stats} />

        <InventoryFilters
            term={term} setTerm={setTerm}
            catFilter={catFilter} setCatFilter={setCatFilter}
            locationFilter={locationFilter} setLocationFilter={setLocationFilter}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            hideZeroStock={hideZeroStock} setHideZeroStock={setHideZeroStock}
            uniqueLocations={uniqueLocations}
            uniqueCategories={uniqueCategories}
            getCategoryIcon={getCategoryIcon}
        />

        <InventoryList
            flatList={flatList}
            isMobile={isMobile}
            selectedIds={selectedIds}
            handleSelectGroup={handleSelectGroup}
            handleSelectRow={handleSelectRow}
            onActions={onActions}
            toggleGroupExpand={toggleGroupExpand}
            copyToClipboard={copyToClipboard}
            getCategoryIcon={getCategoryIcon}
            hasRole={hasRole}
            onAddNew={onAddNew}
            totalGroups={totalGroups}
            filteredItemsCount={filteredItems.length}
            hideZeroStock={hideZeroStock}
            handleSelectAll={handleSelectAll}
            expandedGroups={expandedGroups}
        />

        {/* Floating Action Bar */}
        {selectedIds.size > 0 && hasRole('ADMIN') && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-surface-dark text-white px-6 py-3 rounded-full shadow-xl border border-slate-700 flex items-center gap-6 animate-slide-up z-30 w-[90%] md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-3 text-sm font-medium">
                    <span className="bg-primary text-white rounded-full size-6 flex items-center justify-center text-xs font-bold">{selectedIds.size}</span>
                    <span className="hidden sm:inline">Itens Selecionados</span>
                    <span className="sm:hidden">Sel.</span>
                </div>
                <div className="h-6 w-px bg-slate-700"></div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="danger" 
                        size="sm" 
                        icon="delete" 
                        onClick={handleBulkDelete}
                        className="rounded-full px-4 h-8"
                    >
                        Excluir
                    </Button>
                    <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>
            </div>
        )}
    </PageContainer>
  );
};
