import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface InventoryFiltersProps {
    term: string;
    setTerm: (v: string) => void;
    catFilter: string;
    setCatFilter: (v: string) => void;
    locationFilter: string;
    setLocationFilter: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: any) => void;
    hideZeroStock: boolean;
    setHideZeroStock: (v: boolean) => void;
    uniqueLocations: string[];
    uniqueCategories: string[];
    getCategoryIcon: (cat: string) => string;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
    term, setTerm,
    catFilter, setCatFilter,
    locationFilter, setLocationFilter,
    statusFilter, setStatusFilter,
    hideZeroStock, setHideZeroStock,
    uniqueLocations,
    uniqueCategories,
}) => {
    return (
        <div className="bg-orbital-surface border border-orbital-border rounded mb-6 shadow-sm animate-fade-in">
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">

                    {/* Search */}
                    <div className="lg:col-span-5 relative">
                        <label className="text-xs font-bold uppercase tracking-wider text-orbital-subtext mb-1.5 block">
                            Busca Rápida
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orbital-subtext">
                                <Search size={16} />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-orbital-bg border border-orbital-border text-orbital-text text-sm rounded-md focus:ring-orbital-accent focus:border-orbital-accent block pl-10 p-2.5 placeholder-orbital-subtext/50 transition-colors"
                                placeholder="Nome, SKU, CAS ou lote..."
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="lg:col-span-4 flex flex-col gap-1.5">
                        <label className="text-xs font-display font-bold uppercase tracking-wider text-orbital-subtext pl-1">
                            Status
                        </label>
                        <div className="flex bg-orbital-bg/50 border border-orbital-border rounded p-1 h-[42px]">
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`flex-1 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 ${statusFilter === 'ALL' ? 'bg-orbital-accent text-orbital-bg shadow-glow-sm' : 'text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setStatusFilter('LOW_STOCK')}
                                className={`flex-1 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 ${statusFilter === 'LOW_STOCK' ? 'bg-orbital-warning text-orbital-bg shadow-glow-sm' : 'text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface'}`}
                            >
                                Baixo
                            </button>
                            <button
                                onClick={() => setStatusFilter('EXPIRED')}
                                className={`flex-1 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 ${statusFilter === 'EXPIRED' ? 'bg-orbital-danger text-orbital-bg shadow-glow-sm' : 'text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface'}`}
                            >
                                Vencidos
                            </button>
                        </div>
                    </div>

                    {/* Location Filter */}
                    <div className="lg:col-span-3">
                         <label className="text-xs font-bold uppercase tracking-wider text-orbital-subtext mb-1.5 block">
                            Localização
                        </label>
                        <select
                            className="bg-orbital-bg border border-orbital-border text-orbital-text text-sm rounded-md focus:ring-orbital-accent focus:border-orbital-accent block w-full p-2.5 appearance-none"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        >
                            <option value="">Todas Localizações</option>
                            {uniqueLocations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pt-4 border-t border-orbital-border flex flex-col sm:flex-row gap-4 items-center justify-between">

                    {/* Categories Filter (Chips) */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 custom-scrollbar">
                        <span className="text-xs font-bold text-orbital-subtext whitespace-nowrap mr-2 flex items-center gap-1">
                            <Filter size={12} />
                            CATEGORIA:
                        </span>
                        {uniqueCategories.map((cat) => (
                             <button
                                key={cat}
                                onClick={() => setCatFilter(cat === catFilter ? '' : cat)}
                                className={`
                                    px-3 py-1 text-xs font-mono rounded-full border transition-all duration-200 whitespace-nowrap
                                    ${cat === catFilter
                                        ? 'bg-orbital-accent/20 border-orbital-accent text-orbital-accent shadow-glow-sm'
                                        : 'bg-orbital-surface border-orbital-border text-orbital-subtext hover:border-orbital-subtext hover:text-orbital-text hover:bg-orbital-bg'}
                                `}
                             >
                                {cat || 'Outros'}
                             </button>
                        ))}
                         {catFilter && (
                            <button
                                onClick={() => setCatFilter('')}
                                className="px-2 py-1 text-xs text-orbital-subtext hover:text-orbital-danger underline flex items-center gap-1"
                            >
                                <X size={10} /> Limpar
                            </button>
                        )}
                    </div>

                    {/* Zero Stock Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap select-none">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={hideZeroStock}
                                onChange={(e) => setHideZeroStock(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-orbital-bg border border-orbital-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-orbital-subtext after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orbital-accent peer-checked:border-orbital-accent peer-checked:after:bg-white shadow-inner"></div>
                        </div>
                        <span className="text-xs font-medium text-orbital-subtext group-hover:text-orbital-text transition-colors">
                            Ocultar sem estoque
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};
