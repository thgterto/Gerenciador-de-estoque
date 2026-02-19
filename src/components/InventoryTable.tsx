import React, { useState, useCallback, useEffect } from 'react';
import { InventoryItem } from '../types';
import { PageHeader } from './ui/PageHeader';
import { PageContainer } from './ui/PageContainer';
import { useAuth } from '../context/AuthContext';
import { useStockOperations } from '../hooks/useStockOperations';
import { useInventoryFilters } from '../hooks/useInventoryFilters';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { InventoryKPIs } from './inventory/InventoryKPIs';
import { InventoryFilters } from './inventory/InventoryFilters';
import { InventoryList } from './inventory/InventoryList';
import { Plus, Download, Trash2, X } from 'lucide-react';

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
      if (confirm(`Tem certeza que deseja excluir ${selectedIds.size} itens?`)) {
          const success = await deleteManyItems(Array.from(selectedIds));
          if (success) setSelectedIds(new Set());
      }
  };

  const getCategoryIcon = useCallback((cat: string) => {
      // Logic moved to component rendering level or kept here for strings
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
    <PageContainer scrollable={false} className="h-full">
        <PageHeader 
            title="Inventário" 
            description="Gerencie lotes, reagentes e vidrarias."
        >
            <div className="hidden sm:flex gap-3">
                <OrbitalButton
                    variant="outline"
                    icon={<Download size={16} />}
                    onClick={() => alert("Use o menu de Configurações para exportar dados completos.")}
                >
                    Exportar
                </OrbitalButton>
                {onAddNew && (
                    <OrbitalButton
                        variant="primary"
                        icon={<Plus size={16} />}
                        onClick={onAddNew}
                    >
                        Adicionar
                    </OrbitalButton>
                )}
            </div>
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

        {/* Bulk Actions Floating Bar */}
        {selectedIds.size > 0 && hasRole('ADMIN') && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                <div className="bg-orbital-surface border border-orbital-border rounded-full shadow-glow-lg px-6 py-3 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orbital-accent text-orbital-bg text-xs font-bold">
                            {selectedIds.size}
                        </span>
                        <span className="hidden sm:inline text-sm font-medium text-orbital-text">Itens Selecionados</span>
                    </div>
                    <div className="h-6 w-px bg-orbital-border" />
                    <div className="flex items-center gap-2">
                        <OrbitalButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            onClick={handleBulkDelete}
                            className="rounded-full"
                        >
                            Excluir
                        </OrbitalButton>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="p-2 text-orbital-subtext hover:text-orbital-text transition-colors rounded-full hover:bg-orbital-bg"
                            aria-label="Cancelar seleção"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>
        )}
    </PageContainer>
  );
};
