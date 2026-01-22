
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { InventoryItem } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select'; 
import { Card } from './ui/Card';
import { MetricCard } from './ui/MetricCard';
import { EmptyState } from './ui/EmptyState';
import { PageHeader } from './ui/PageHeader';
import { PageContainer } from './ui/PageContainer';
import { useAuth } from '../context/AuthContext';
import { useStockOperations } from '../hooks/useStockOperations';
import { useInventoryFilters } from '../hooks/useInventoryFilters';
import { 
    InventoryChildRow, 
    InventoryGroupRow, 
    InventoryMobileGroupRow, 
    InventoryMobileChildRow 
} from './InventoryRows';
import * as ReactWindow from 'react-window';
import * as AutoSizerPkg from 'react-virtualized-auto-sizer';

const VariableSizeList = (ReactWindow as any).VariableSizeList || (ReactWindow as any).default?.VariableSizeList || (ReactWindow as any).default;
const List = VariableSizeList;
const AutoSizer = (AutoSizerPkg as any).default || AutoSizerPkg;

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

const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

// Row Component estático para evitar recriação
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

export const InventoryTable: React.FC<Props> = ({ items, onActions, onAddNew }) => {
  const { hasRole } = useAuth();
  const { deleteManyItems } = useStockOperations();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const listRef = useRef<any>(null);

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

  useEffect(() => {
      if (listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
          listRef.current.resetAfterIndex(0);
      }
  }, [isMobile, flatList, expandedGroups]);

  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          const allIds = new Set(filteredItems.map(i => i.id));
          setSelectedIds(allIds);
      } else {
          setSelectedIds(new Set());
      }
  };

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

  const getItemSize = useCallback((index: number) => {
      const item = flatList[index];
      if (isMobile) {
          if (item.type === 'GROUP') return item.expanded ? 110 : 100;
          return 130;
      }
      return item.type === 'GROUP' ? 64 : 48; 
  }, [flatList, isMobile]);

  const itemKey = useCallback((index: number) => flatList[index]?.id || index, [flatList]);

  // Prepara dados para passar ao componente de linha sem recriar a função render prop
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

        {/* KPIs Block - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 mb-6">
             <MetricCard 
                title="Itens Ativos"
                icon="inventory_2"
                value={stats.totalItems}
                subValue="Lotes totais"
                variant="primary"
                className="h-24 sm:h-28"
             />
             <MetricCard 
                title="Baixo Estoque"
                icon="warning"
                value={stats.lowStockCount}
                subValue="Requer atenção"
                variant="warning"
                className="h-24 sm:h-28"
             />
             <MetricCard 
                title="Vencidos"
                icon="event_busy"
                value={stats.expiredCount}
                subValue="Descartar"
                variant="danger"
                className="h-24 sm:h-28"
             />
        </div>

        {/* Filters Block */}
        <Card padding="p-4" className="flex flex-col gap-4 shrink-0 mb-6 shadow-sm" id="tour-inv-filters">
             <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                <div className="flex-1 w-full">
                    <Input 
                        label="Busca Rápida"
                        icon="search"
                        placeholder="Nome, SKU, CAS ou lote..." 
                        value={term}
                        onChange={e => setTerm(e.target.value)}
                        containerClassName="w-full"
                    />
                </div>
                 
                 <div className="flex flex-col w-full md:w-auto">
                    <label className="text-[13px] font-medium text-text-main dark:text-white mb-1.5">Status</label>
                    <div className="flex flex-wrap bg-background-light dark:bg-slate-800 p-1 rounded-lg border border-border-light dark:border-border-dark">
                        {[
                            { id: 'ALL', label: 'Todos' },
                            { id: 'LOW_STOCK', label: 'Baixo' },
                            { id: 'EXPIRED', label: 'Vencidos' }
                        ].map(opt => (
                            <button 
                                key={opt.id}
                                onClick={() => setStatusFilter(opt.id as any)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                                    statusFilter === opt.id 
                                    ? 'bg-surface-light dark:bg-slate-600 text-text-main dark:text-white shadow-sm' 
                                    : 'text-text-secondary hover:text-text-main dark:hover:text-slate-200'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div className="w-full md:w-64">
                    <Select 
                        label="Localização"
                        icon="location_on"
                        value={locationFilter}
                        onChange={e => setLocationFilter(e.target.value)}
                        containerClassName="w-full"
                    >
                        <option value="">Todas Localizações</option>
                        {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </Select>
                </div>
             </div>

             <div className="flex items-center gap-4 pt-3 border-t border-border-light dark:border-border-dark overflow-x-auto pb-1 no-scrollbar">
                <div 
                    className="flex items-center gap-2 cursor-pointer group shrink-0" 
                    onClick={() => setHideZeroStock(!hideZeroStock)}
                    title="Ocultar itens com saldo zero ou negativo"
                >
                     <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${hideZeroStock ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        <div className={`absolute top-1 left-1 size-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${hideZeroStock ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                     <span className="text-xs font-medium text-text-secondary dark:text-slate-400 group-hover:text-text-main dark:group-hover:text-white transition-colors select-none">
                         Ocultar zerados
                     </span>
                </div>

                <div className="h-4 w-px bg-border-light dark:border-border-dark shrink-0"></div>

                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider shrink-0">Filtro Rápido:</span>
                <div className="flex gap-2">
                    {uniqueCategories.map((cat) => (
                        <button 
                            key={cat}
                            onClick={() => setCatFilter(cat)} 
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                                catFilter === cat 
                                ? 'bg-primary/10 text-primary border-primary/20' 
                                : 'bg-surface-light dark:bg-slate-800 text-text-secondary dark:text-slate-300 border-border-light dark:border-border-dark hover:border-slate-300'
                            }`}
                        >
                            {cat === '' ? 'Todas' : (
                                <>
                                    <span className="material-symbols-outlined text-[14px]">{getCategoryIcon(cat)}</span>
                                    {cat}
                                </>
                            )}
                        </button>
                    ))}
                </div>
             </div>
        </Card>

        {/* Table Block - Fills Remaining Space */}
        <Card padding="p-0" className={`flex-1 min-h-0 flex flex-col ${isMobile ? 'bg-transparent border-none shadow-none' : 'bg-surface-light dark:bg-surface-dark'} relative overflow-hidden`}>
             {!isMobile && (
                 <div className="bg-background-light dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-slate-400 shrink-0 z-10">
                    <div className="grid items-center px-4" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                        <div className="flex items-center justify-center">
                            <input 
                                className="w-4 h-4 text-primary bg-surface-light dark:bg-slate-800 border-border-light dark:border-border-dark rounded focus:ring-primary cursor-pointer transition-colors" 
                                type="checkbox"
                                checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
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
                        {({ height, width }: { height: number; width: number }) => (
                            <List
                                ref={listRef}
                                height={height}
                                itemCount={flatList.length}
                                itemSize={getItemSize}
                                itemKey={itemKey}
                                width={width}
                                className="custom-scrollbar"
                                itemData={itemData}
                            >
                                {InventoryRow}
                            </List>
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
                 <div className="bg-background-light dark:bg-slate-800/50 px-6 py-3 border-t border-border-light dark:border-border-dark text-xs text-text-secondary dark:text-slate-400 flex justify-between shrink-0 font-medium">
                     <span>{totalGroups} Produtos • {filteredItems.length} Lotes Individuais</span>
                     <span>{hideZeroStock ? 'Ocultando itens sem estoque' : 'Exibindo todos os itens'}</span>
                 </div>
             )}
        </Card>

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
