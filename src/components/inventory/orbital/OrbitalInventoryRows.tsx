import React from 'react';
import { InventoryItem } from '../../../types';
import { InventoryGroup } from '../../../hooks/useInventoryFilters';
import { getItemStatus } from '../../../utils/businessRules';
import { formatDate } from '../../../utils/formatters';
import { OrbitalBadge } from '../../ui/orbital/OrbitalBadge';
import { OrbitalButton } from '../../ui/orbital/OrbitalButton';

// Icons
import {
    Copy,
    Edit,
    ArrowLeftRight,
    QrCode,
    MapPin,
    ChevronRight
} from 'lucide-react';

const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

interface ChildRowProps {
    item: InventoryItem;
    style: React.CSSProperties;
    isSelected: boolean;
    isAdmin: boolean;
    onSelect: (id: string) => void;
    onActions: {
        edit: (item: InventoryItem) => void;
        move: (item: InventoryItem) => void;
        delete: (id: string, name: string) => void;
        request: () => void;
        qr: (item: InventoryItem) => void;
        viewHistory: (item: InventoryItem) => void;
        clone: (item: InventoryItem) => void;
    };
    copyToClipboard: (text: string, label: string) => void;
    isLast: boolean;
}

export const OrbitalInventoryChildRow = React.memo(({
    item,
    style,
    isSelected,
    onActions,
    copyToClipboard,
    isLast
}: ChildRowProps) => {
    const status = getItemStatus(item);

    let validityContent = formatDate(item.expiryDate);
    let validityColor = status.isExpired ? 'text-orbital-danger font-bold' : 'text-gray-400';

    if (item.itemType === 'EQUIPMENT' && item.maintenanceDate) {
        validityContent = `Manut: ${formatDate(item.maintenanceDate)}`;
        validityColor = 'text-orbital-primary';
    } else if (item.itemType === 'GLASSWARE' && item.glassVolume) {
        validityContent = item.glassVolume;
        validityColor = 'text-gray-400';
    }

    return (
        <div style={style} className={`
            group relative text-sm font-mono transition-colors duration-150
            ${isSelected ? 'bg-orbital-primary/10' : 'hover:bg-white/5'}
            ${!isLast ? 'border-b border-orbital-border/30' : ''}
        `}>
            {/* Indentation Lines */}
            <div className="absolute left-5 top-0 bottom-1/2 w-px border-l border-dashed border-orbital-border/50" />
            <div className="absolute left-5 top-1/2 w-6 h-px border-t border-dashed border-orbital-border/50" />

            <div style={{ display: 'grid', gridTemplateColumns: GRID_TEMPLATE, alignItems: 'center', height: '100%' }} className="px-4">

                <div /> {/* Spacer for tree structure */}

                <div className="px-2 pl-8 flex items-center gap-3 overflow-hidden">
                    <QrCode size={16} className="text-gray-500" />
                    <button
                        onClick={() => copyToClipboard(item.lotNumber, 'Lote')}
                        className="bg-orbital-card/50 px-1.5 py-0.5 rounded text-xs font-bold font-mono text-gray-300 hover:text-orbital-primary transition-colors cursor-copy truncate"
                        title={`Lote: ${item.lotNumber}`}
                    >
                        {item.lotNumber}
                    </button>
                    {item.isGhost && <OrbitalBadge label="LEGADO" size="sm" color="default" />}
                </div>

                <div /> {/* Category Spacer */}

                <div className="px-2 flex items-center gap-1.5 text-gray-500 text-xs">
                    <MapPin size={14} />
                    <span className="truncate" title={`${item.location.warehouse} ${item.location.cabinet ? `› ${item.location.cabinet}` : ''}`}>
                        {item.location.warehouse} {item.location.cabinet ? `› ${item.location.cabinet}` : ''}
                    </span>
                </div>

                <div className="px-2 text-right font-bold text-gray-200">
                    {item.quantity}
                </div>

                <div className="px-2 text-right">
                    <span className={`text-xs ${validityColor}`}>
                        {validityContent}
                    </span>
                </div>

                <div className="px-2 flex justify-center">
                    {(status.isExpired || status.isLowStock) && (
                        <OrbitalBadge
                            label={status.isExpired ? 'VENCIDO' : 'BAIXO'}
                            color={status.isExpired ? 'danger' : 'warning'}
                            size="sm"
                        />
                    )}
                </div>

                <div className="px-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <OrbitalButton variant="ghost" size="sm" onClick={() => onActions.clone(item)} className="!p-1" title="Clonar">
                        <Copy size={14} />
                    </OrbitalButton>
                    <OrbitalButton variant="ghost" size="sm" onClick={() => onActions.edit(item)} className="!p-1" title="Editar">
                        <Edit size={14} />
                    </OrbitalButton>
                    <OrbitalButton variant="ghost" size="sm" onClick={() => onActions.move(item)} className="!p-1" title="Movimentar">
                        <ArrowLeftRight size={14} />
                    </OrbitalButton>
                </div>
            </div>
        </div>
    );
});

interface GroupRowProps {
    group: InventoryGroup;
    style: React.CSSProperties;
    isExpanded: boolean;
    toggleExpand: () => void;
    selectedChildIds: Set<string>;
    onSelectGroup: (groupIds: string[], checked: boolean) => void;
    getCategoryIcon: (cat: string) => string; // We'll ignore the icon logic for now or rely on a helper
    copyToClipboard: (text: string, label: string) => void;
}

export const OrbitalInventoryGroupRow = React.memo(({
    group,
    style,
    isExpanded,
    toggleExpand,
    selectedChildIds,
    onSelectGroup,
    getCategoryIcon: _getCategoryIcon,
    copyToClipboard
}: GroupRowProps) => {
    const { primaryItem, totalQuantity, aggregatedStatus, items } = group;
    const allSelected = items.every(i => selectedChildIds.has(i.id));
    const someSelected = items.some(i => selectedChildIds.has(i.id));

    return (
        <div style={style} className={`
            border-b border-orbital-border/50 cursor-pointer transition-colors duration-150
            ${isExpanded ? 'bg-orbital-card border-l-2 border-l-orbital-primary' : 'hover:bg-white/5 border-l-2 border-l-transparent'}
        `}
        onClick={toggleExpand}
        >
            <div style={{ display: 'grid', gridTemplateColumns: GRID_TEMPLATE, alignItems: 'center', height: '100%' }} className="px-4">

                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={input => { if(input) input.indeterminate = someSelected && !allSelected; }}
                        onChange={(e) => onSelectGroup(items.map(i => i.id), e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orbital-primary focus:ring-orbital-primary focus:ring-offset-gray-900"
                    />
                </div>

                <div className="px-2 overflow-hidden">
                    <div className="flex items-center gap-3">
                         <div className={`
                             p-1.5 rounded flex items-center justify-center
                             ${isExpanded ? 'bg-orbital-primary text-black' : 'bg-gray-800 text-gray-400'}
                         `}>
                             {/* Placeholder Icon since Material Icons are strings like 'science' */}
                             <span className="font-bold text-xs w-4 h-4 flex items-center justify-center">
                                {primaryItem.name.charAt(0)}
                             </span>
                         </div>
                         <div className="min-w-0">
                             <div className="font-bold text-gray-200 truncate" title={primaryItem.name}>
                                 {primaryItem.name}
                             </div>
                             <div className="flex items-center gap-2 mt-0.5">
                                 <button
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(primaryItem.sapCode, 'SKU'); }}
                                    className="text-[10px] font-mono text-gray-500 hover:text-orbital-primary transition-colors cursor-copy"
                                 >
                                     {primaryItem.sapCode || 'N/A'}
                                 </button>
                                 {items.length > 1 && (
                                     <span className="text-[10px] bg-gray-800 border border-gray-700 px-1.5 rounded text-gray-400">
                                         {items.length} lotes
                                     </span>
                                 )}
                             </div>
                         </div>
                    </div>
                </div>

                <div className="px-2">
                     <OrbitalBadge label={primaryItem.category} size="sm" color="secondary" />
                </div>

                <div className="px-2">
                    <span className="text-xs text-gray-500 truncate block" title={group.locations.join(', ')}>
                        {group.locations.length === 1 ? group.locations[0] : `${group.locations.length} locais`}
                    </span>
                </div>

                <div className="px-2 text-right">
                     <span className="font-bold text-gray-200">
                        {totalQuantity.toLocaleString('pt-BR')} <span className="text-xs text-gray-500 font-normal">{primaryItem.baseUnit}</span>
                     </span>
                </div>

                <div className="px-2 text-right">
                    {aggregatedStatus.isExpired ? (
                         <OrbitalBadge label="VENCIDOS" color="danger" size="sm" />
                    ) : (
                         <span className="text-gray-600">--</span>
                    )}
                </div>

                <div className="px-2 flex justify-center">
                    {(aggregatedStatus.isExpired || aggregatedStatus.isLowStock) && (
                        <OrbitalBadge
                            label={aggregatedStatus.isExpired ? 'CRÍTICO' : 'ATENÇÃO'}
                            color={aggregatedStatus.isExpired ? 'danger' : 'warning'}
                            size="sm"
                        />
                    )}
                </div>

                <div className="px-2 text-right">
                     <ChevronRight
                        size={16}
                        className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-orbital-primary' : ''}`}
                    />
                </div>
            </div>
        </div>
    );
});
