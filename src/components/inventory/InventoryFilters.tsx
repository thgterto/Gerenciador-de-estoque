import React from 'react';
import { Search, Filter } from 'lucide-react';
import { OrbitalCard } from '../ui/orbital/OrbitalCard';
import { OrbitalInput } from '../ui/orbital/OrbitalInput';
import { OrbitalSelect } from '../ui/orbital/OrbitalSelect';

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
        <OrbitalCard className="mb-6 animate-fade-in" noPadding>
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">

                    {/* Search */}
                    <div className="lg:col-span-5">
                        <OrbitalInput
                            label="Busca Rápida"
                            placeholder="Nome, SKU, CAS ou lote..."
                            value={term}
                            onChange={e => setTerm(e.target.value)}
                            fullWidth
                            startAdornment={<Search size={16} />}
                        />
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
                         <OrbitalSelect
                            label="Localização"
                            value={locationFilter}
                            onChange={e => setLocationFilter(e.target.value)}
                            options={[
                                { value: "", label: "Todas Localizações" },
                                ...uniqueLocations.map(loc => ({ value: loc, label: loc }))
                            ]}
                            fullWidth
                        />
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
                                    ${catFilter === cat
                                        ? 'bg-orbital-accent/20 border-orbital-accent text-orbital-accent shadow-glow-sm'
                                        : 'bg-orbital-surface border-orbital-border text-orbital-subtext hover:border-orbital-subtext hover:text-orbital-text'}
                                `}
                             >
                                {cat || 'Outros'}
                             </button>
                        ))}
                         {catFilter && (
                            <button
                                onClick={() => setCatFilter('')}
                                className="px-2 py-1 text-xs text-orbital-subtext hover:text-orbital-danger underline"
                            >
                                Limpar
                            </button>
                        )}
                    </div>

                    {/* Zero Stock Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
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
        </OrbitalCard>
    );
};
