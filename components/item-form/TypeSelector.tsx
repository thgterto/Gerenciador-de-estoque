
import React from 'react';
import { ItemType } from '../../types';

interface TypeSelectorProps {
    currentType: ItemType;
    onChange: (type: ItemType) => void;
}

const TYPE_CONFIG: Record<ItemType, { label: string, icon: string, color: string, activeClass: string }> = {
    'REAGENT': { label: 'Reagente', icon: 'science', color: 'text-primary', activeClass: 'bg-primary text-white shadow-md' },
    'GLASSWARE': { label: 'Vidraria', icon: 'biotech', color: 'text-secondary', activeClass: 'bg-secondary text-white shadow-md' },
    'EQUIPMENT': { label: 'Equipamento', icon: 'precision_manufacturing', color: 'text-blue-600', activeClass: 'bg-blue-600 text-white shadow-md' },
    'SPARE_PART': { label: 'Peça Rep.', icon: 'settings_suggest', color: 'text-orange-500', activeClass: 'bg-orange-500 text-white shadow-md' },
    'CONSUMABLE': { label: 'Consumível', icon: 'inventory', color: 'text-emerald-600', activeClass: 'bg-emerald-600 text-white shadow-md' },
};

export const TypeSelector: React.FC<TypeSelectorProps> = ({ currentType, onChange }) => {
    return (
        <div className="flex flex-wrap gap-2 w-full pb-4 shrink-0">
            {(Object.entries(TYPE_CONFIG) as [ItemType, typeof TYPE_CONFIG[ItemType]][]).map(([key, config]) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border
                        ${currentType === key
                            ? `${config.activeClass} border-transparent`
                            : 'bg-white dark:bg-slate-800 text-text-secondary dark:text-gray-400 border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-700'
                        }
                    `}
                >
                    <span className="material-symbols-outlined text-[18px]">{config.icon}</span>
                    {config.label}
                </button>
            ))}
        </div>
    );
};
