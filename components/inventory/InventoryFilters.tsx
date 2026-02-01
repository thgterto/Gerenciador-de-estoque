import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';

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
    getCategoryIcon
}) => {
    return (
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
                <button
                    type="button"
                    role="switch"
                    aria-checked={hideZeroStock}
                    className="flex items-center gap-2 cursor-pointer group shrink-0 bg-transparent border-none p-0 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                    onClick={() => setHideZeroStock(!hideZeroStock)}
                    title="Ocultar itens com saldo zero ou negativo"
                >
                     <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${hideZeroStock ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        <div className={`absolute top-1 left-1 size-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${hideZeroStock ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                     <span className="text-xs font-medium text-text-secondary dark:text-slate-400 group-hover:text-text-main dark:group-hover:text-white transition-colors select-none">
                         Ocultar zerados
                     </span>
                </button>

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
    );
};
