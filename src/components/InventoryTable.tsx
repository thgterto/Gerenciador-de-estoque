import React, { useState, useEffect, useCallback } from 'react';
import { InventoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useStockOperations } from '../hooks/useStockOperations';
import { useInventoryFilters } from '../hooks/useInventoryFilters';
import { OrbitalPageHeader } from './ui/orbital/OrbitalPageHeader';
import { OrbitalInventoryList } from './inventory/orbital/OrbitalInventoryList';
import { OrbitalStat } from './ui/orbital/OrbitalStat';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { OrbitalSelect } from './ui/orbital/OrbitalSelect';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalCard } from './ui/orbital/OrbitalCard';

// Icons
import {
    Plus,
    Download,
    Trash2,
    X,
    Search,
    Package,
    AlertTriangle,
    XCircle
} from 'lucide-react';

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

  const getCategoryIcon = useCallback((_cat: string) => {
      // Icon mapping logic if needed, currently unused in Orbital row
      return 'box';
  }, []);

  const copyToClipboard = useCallback((text: string) => {
      if(!text) return;
      navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="flex flex-col h-full space-y-4">
        <OrbitalPageHeader
            title="Inventário" 
            description="Gerenciamento de estoque em tempo real."
            breadcrumbs={[{ label: 'Inventário' }]}
            actions={
                <div className="flex gap-2">
                    <OrbitalButton variant="secondary" startIcon={<Download size={16} />} onClick={() => alert("Use Configurações para exportar.")}>
                        Exportar
                    </OrbitalButton>
                    {onAddNew && (
                        <OrbitalButton variant="primary" startIcon={<Plus size={16} />} onClick={onAddNew}>
                            Adicionar
                        </OrbitalButton>
                    )}
                </div>
            }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <OrbitalStat
                label="Total de Lotes"
                value={stats.totalItems}
                icon={<Package size={24} />}
                color="primary"
             />
             <OrbitalStat
                label="Baixo Estoque"
                value={stats.lowStockCount}
                icon={<AlertTriangle size={24} />}
                color="warning"
                trend={stats.lowStockCount > 0 ? 'down' : 'neutral'}
             />
             <OrbitalStat
                label="Vencidos"
                value={stats.expiredCount}
                icon={<XCircle size={24} />}
                color="danger"
                trend={stats.expiredCount > 0 ? 'down' : 'neutral'}
             />
        </div>

        {/* Filters */}
        <OrbitalCard className="p-4" noPadding>
            <div className="p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <OrbitalInput
                            placeholder="BUSCAR POR NOME, SKU, LOTE..."
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            startIcon={<Search size={16} />}
                            fullWidth
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <OrbitalSelect
                            options={[
                                { value: 'ALL', label: 'Todos Status' },
                                { value: 'LOW_STOCK', label: 'Baixo Estoque' },
                                { value: 'EXPIRED', label: 'Vencidos' }
                            ]}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                         <OrbitalSelect
                            options={[
                                { value: '', label: 'Todas Localizações' },
                                ...uniqueLocations.map(loc => ({ value: loc, label: loc }))
                            ]}
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-orbital-border/50 gap-4">
                     <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={hideZeroStock}
                            onChange={(e) => setHideZeroStock(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orbital-primary focus:ring-orbital-primary focus:ring-offset-gray-900"
                            id="hideZero"
                        />
                        <label htmlFor="hideZero" className="text-sm font-mono text-gray-400 cursor-pointer select-none">
                            Ocultar itens sem estoque
                        </label>
                     </div>

                     <div className="flex flex-wrap gap-2 items-center">
                         <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mr-2">Filtro Rápido:</span>
                         {uniqueCategories.map(cat => (
                             <button
                                key={cat}
                                onClick={() => setCatFilter(cat === catFilter ? '' : cat)}
                                className={`
                                    px-2 py-1 rounded text-xs font-mono uppercase tracking-wide border transition-all
                                    ${cat === catFilter
                                        ? 'bg-orbital-primary/20 text-orbital-primary border-orbital-primary'
                                        : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500 hover:text-gray-300'}
                                `}
                             >
                                 {cat || 'OUTROS'}
                             </button>
                         ))}
                     </div>
                </div>
            </div>
        </OrbitalCard>

        {/* Inventory List */}
        <OrbitalInventoryList
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
                <div className="bg-orbital-card border border-orbital-border shadow-orbital-hover rounded-full px-6 py-3 flex items-center gap-6 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-orbital-primary text-black flex items-center justify-center font-bold text-xs">
                            {selectedIds.size}
                        </div>
                        <span className="text-sm font-mono text-gray-200 hidden sm:inline">ITENS SELECIONADOS</span>
                    </div>

                    <div className="h-4 w-px bg-gray-700" />

                    <div className="flex items-center gap-2">
                        <OrbitalButton
                            variant="danger"
                            size="sm"
                            onClick={handleBulkDelete}
                            startIcon={<Trash2 size={14} />}
                        >
                            EXCLUIR
                        </OrbitalButton>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
