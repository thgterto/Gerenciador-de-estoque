import React from 'react';
import { ItemType } from '../../types';
import { FlaskConical, TestTube, Microscope, Wrench, Package } from 'lucide-react';

interface TypeSelectorProps {
    currentType: ItemType;
    onChange: (type: ItemType) => void;
}

const TYPE_CONFIG: Record<ItemType, { label: string, icon: React.ReactNode }> = {
    'REAGENT': { label: 'Reagente', icon: <FlaskConical size={16} /> },
    'GLASSWARE': { label: 'Vidraria', icon: <TestTube size={16} /> },
    'EQUIPMENT': { label: 'Equipamento', icon: <Microscope size={16} /> },
    'SPARE_PART': { label: 'Peça Rep.', icon: <Wrench size={16} /> },
    'CONSUMABLE': { label: 'Consumível', icon: <Package size={16} /> },
};

export const TypeSelector: React.FC<TypeSelectorProps> = ({ currentType, onChange }) => {
    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="flex bg-orbital-bg/50 border border-orbital-border rounded p-1 min-w-max" role="radiogroup" aria-label="Tipo de Item">
                {(Object.entries(TYPE_CONFIG) as [ItemType, typeof TYPE_CONFIG[ItemType]][]).map(([key, config]) => (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={currentType === key}
                        onClick={() => onChange(key)}
                        className={`
                            flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200
                            ${currentType === key
                                ? 'bg-orbital-accent text-orbital-bg shadow-glow-sm'
                                : 'text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface'}
                        `}
                    >
                        <span aria-hidden="true">{config.icon}</span>
                        <span>{config.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
