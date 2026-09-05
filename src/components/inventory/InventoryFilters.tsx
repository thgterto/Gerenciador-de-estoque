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
                                type="button"
                                aria-pressed={statusFilter === 'ALL'}
                                onClick={() => setStatusFilter('ALL')}
                                className={`flex-1 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbital-accent focus-visible:ring-offset-1 focus-visible:ring-offset-orbital-bg/50 ${statusFilter === 'ALL' ? 'bg-orbital-accent text-orbital-bg shadow-glow-sm' : 'text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface'}`}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                aria-pressed={statusFilter === 'LOW_STOCK'}
                                onClick={() => setStatusFilter('LOW_STOCK')}
                                className={`flex-1 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbital-warning focus-visible:ring-offset-1 focus-visible:ring-offset-orbital-bg/50 ${statusFilter === 'LOW_STOCK' ? 'bg-orbital-warning text-orbital-bg shadow-glow-sm' : 'text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface'}`}
                            >
                                Baixo
                            </button>
                            <button
                                type="button"
                                aria-pressed={statusFilter === 'EXPIRED'}
                                onClick={() => setStatusFilter('EXPIRED')}
                                className={`flex-1 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbital-danger focus-visible:ring-offset-1 focus-visible:ring-offset-orbital-bg/50 ${statusFilter === 'EXPIRED' ? 'bg-orbital-danger text-orbital-bg shadow-glow-sm' : 'text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface'}`}
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
                                type="button"
                                aria-pressed={catFilter === cat}
                                onClick={() => setCatFilter(cat === catFilter ? '' : cat)}
                                className={`
                                    px-3 py-1 text-xs font-mono rounded-full border transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbital-accent focus-visible:ring-offset-1 focus-visible:ring-offset-orbital-bg/50
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
                                type="button"
                                onClick={() => setCatFilter('')}
                                className="px-2 py-1 text-xs text-orbital-subtext hover:text-orbital-danger underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbital-danger rounded"
                            >
                                Limpar
                            </button>
                        )}
                    </div>

                    {/* Zero Stock Toggle */}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={hideZeroStock}
                        onClick={() => setHideZeroStock(!hideZeroStock)}
                        className="flex items-center gap-2 cursor-pointer group whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbital-accent rounded p-1"
                    >
                        <div className="relative pointer-events-none">
                            <div className={`w-9 h-5 border rounded-full shadow-inner transition-all ${hideZeroStock ? 'bg-orbital-accent border-orbital-accent' : 'bg-orbital-bg border-orbital-border'}`}></div>
                            <div className={`absolute top-[2px] left-[2px] rounded-full h-3.5 w-3.5 transition-all border ${hideZeroStock ? 'translate-x-4 border-white bg-white' : 'translate-x-0 border-gray-300 bg-orbital-subtext'}`}></div>
                        </div>
                        <span className="text-xs font-medium text-orbital-subtext group-hover:text-orbital-text transition-colors">
                            Ocultar sem estoque
                        </span>
                    </button>
                </div>
            </div>
        </OrbitalCard>
    );
};
