import React from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { InventoryItem } from '../types';
import { InventoryGroup } from '../hooks/useInventoryFilters';
import { getItemStatus } from '../utils/businessRules';
import { formatDate } from '../utils/formatters';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import {
    Copy,
    Edit,
    ArrowRightLeft,
    QrCode,
    MapPin,
    ChevronRight,
    Warehouse,
    Printer,
    FlaskConical
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

export const InventoryChildRow = React.memo(({ 
    item, 
    style,
    isSelected, 
    onActions,
    copyToClipboard,
    isLast
}: ChildRowProps) => {
    const status = getItemStatus(item);
    
    let validityContent = formatDate(item.expiryDate);
    let validityColor = status.isExpired ? 'text-orbital-danger font-bold' : 'text-orbital-subtext';
    let validityTooltip = "Validade";

    if (item.itemType === 'EQUIPMENT' && item.maintenanceDate) {
        validityContent = `Manut: ${formatDate(item.maintenanceDate)}`;
        validityColor = 'text-orbital-accent';
        validityTooltip = "Próxima Manutenção";
    } else if (item.itemType === 'GLASSWARE' && item.glassVolume) {
        validityContent = item.glassVolume;
        validityColor = 'text-orbital-subtext';
        validityTooltip = "Volume Nominal";
    }

    return (
        <div style={style}>
            <div
                className={`
                    h-full relative border-b border-orbital-border/30 transition-colors duration-200 group
                    ${isSelected ? 'bg-orbital-accent/10' : 'bg-transparent hover:bg-orbital-surface'}
                    ${isLast ? 'border-b-0' : ''}
                `}
            >
                {/* Tree Lines */}
                <div className="absolute left-5 top-0 bottom-1/2 w-px border-l border-dashed border-orbital-subtext/30" />
                <div className="absolute left-5 top-1/2 w-6 h-px border-t border-dashed border-orbital-subtext/30" />

                <div
                    className="grid items-center h-full px-4"
                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                >
                    
                    <div /> {/* Spacer for checkbox column */}

                    {/* Lote / SKU */}
                    <div className="px-2 pl-6 flex items-center gap-2 overflow-hidden">
                        <QrCode className="text-orbital-subtext" size={14} />
                        <button
                            title={`Lote: ${item.lotNumber}`}
                            onClick={() => copyToClipboard(item.lotNumber, 'Lote')}
                            className="font-mono text-xs font-bold text-orbital-text hover:text-orbital-accent transition-colors truncate"
                        >
                            {item.lotNumber}
                        </button>
                        {item.isGhost && (
                            <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold border border-orbital-subtext text-orbital-subtext rounded-none opacity-70">
                                Legado
                            </span>
                        )}
                    </div>

                    <div /> {/* Spacer for Category */}

                    {/* Location */}
                    <div className="px-2 flex items-center gap-1.5 text-orbital-subtext overflow-hidden">
                        <MapPin size={14} className="shrink-0" />
                        <span className="text-xs truncate">
                            {item.location.warehouse} {item.location.cabinet ? `› ${item.location.cabinet}` : ''}
                        </span>
                    </div>

                    {/* Quantity */}
                    <div className="px-2 text-right">
                        <span className="text-sm font-bold text-orbital-text">{item.quantity}</span>
                    </div>

                    {/* Validity */}
                    <div className="px-2 text-right">
                        <span title={validityTooltip} className={`text-xs ${validityColor}`}>
                            {validityContent}
                        </span>
                    </div>

                    {/* Status */}
                    <div className="px-2 flex justify-center">
                        {(status.isExpired || status.isLowStock) && (
                            <OrbitalBadge variant={status.variant} label={status.label} className="scale-90" />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <ActionBtn onClick={() => onActions.clone(item)} title="Clonar" icon={<Copy size={14} />} />
                        <ActionBtn onClick={() => onActions.edit(item)} title="Editar" icon={<Edit size={14} />} />
                        <ActionBtn onClick={() => onActions.move(item)} title="Movimentar" icon={<ArrowRightLeft size={14} />} />
                    </div>
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
    // getCategoryIcon removed as it was unused/hardcoded
    copyToClipboard: (text: string, label: string) => void;
}

export const InventoryGroupRow = React.memo(({ 
    group, 
    style,
    isExpanded, 
    toggleExpand, 
    selectedChildIds,
    onSelectGroup,
    copyToClipboard
}: GroupRowProps) => {
    const { primaryItem, totalQuantity, aggregatedStatus, items } = group;
    const allSelected = items.every(i => selectedChildIds.has(i.id));
    const someSelected = items.some(i => selectedChildIds.has(i.id));

    return (
        <div style={style}>
            <div
                className={`
                    h-full border-b border-orbital-border cursor-pointer transition-colors duration-200 group
                    ${isExpanded ? 'bg-orbital-accent/5' : 'bg-orbital-bg hover:bg-orbital-surface'}
                `}
                onClick={toggleExpand}
            >
                <div
                    className="grid items-center h-full px-4"
                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                >
                    
                    {/* Checkbox */}
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            className="accent-orbital-accent w-4 h-4 cursor-pointer"
                            checked={allSelected}
                            ref={input => {
                                if (input) input.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={(e) => onSelectGroup(items.map(i => i.id), e.target.checked)}
                        />
                    </div>

                    {/* Product Name */}
                    <div className="px-2 overflow-hidden">
                        <div className="flex items-center gap-3">
                             <div className={`
                                 p-1 rounded flex shrink-0 transition-colors duration-200
                                 ${isExpanded ? 'bg-orbital-accent text-orbital-bg shadow-glow-sm' : 'bg-orbital-surface text-orbital-subtext'}
                             `}>
                                 <FlaskConical size={16} /> {/* Generic icon for category */}
                             </div>
                             <div className="min-w-0">
                                 <div className="text-sm font-bold text-orbital-text truncate" title={primaryItem.name}>
                                     {primaryItem.name}
                                 </div>
                                 <div className="flex items-center gap-2 mt-0.5">
                                     <button
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(primaryItem.sapCode, 'SKU'); }}
                                        className="font-mono text-[10px] text-orbital-subtext hover:text-orbital-accent transition-colors"
                                     >
                                         {primaryItem.sapCode || 'N/A'}
                                     </button>
                                     {items.length > 1 && (
                                         <span className="px-1 py-0.5 text-[9px] border border-orbital-border rounded text-orbital-subtext">
                                             {items.length} lotes
                                         </span>
                                     )}
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Category */}
                    <div className="px-2">
                         <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-orbital-surface border border-orbital-border text-orbital-subtext rounded-none">
                             {primaryItem.category}
                         </span>
                    </div>

                    {/* Locations Summary */}
                    <div className="px-2">
                        <span className="text-xs text-orbital-subtext truncate block" title={group.locations.join(', ')}>
                            {group.locations.length === 1 ? group.locations[0] : `${group.locations.length} locais`}
                        </span>
                    </div>

                    {/* Total Quantity */}
                    <div className="px-2 text-right">
                         <div className="text-sm font-bold text-orbital-text">
                            {totalQuantity.toLocaleString('pt-BR')} <span className="text-[10px] text-orbital-subtext font-normal">{primaryItem.baseUnit}</span>
                         </div>
                    </div>

                    {/* Expiry Warning */}
                    <div className="px-2 text-right">
                        {aggregatedStatus.isExpired ? (
                             <OrbitalBadge variant="danger" label="Vencidos" />
                        ) : (
                             <span className="text-xs text-orbital-border">--</span>
                        )}
                    </div>

                    {/* Status */}
                    <div className="px-2 flex justify-center">
                        <OrbitalBadge variant={aggregatedStatus.variant} label={aggregatedStatus.label === 'Em Estoque' ? 'OK' : aggregatedStatus.label} />
                    </div>

                    {/* Expand Icon */}
                    <div className="px-2 text-right">
                         <ChevronRight
                            size={16}
                            className={`transition-transform duration-200 text-orbital-subtext group-hover:text-orbital-accent ${isExpanded ? 'rotate-90 text-orbital-accent' : ''}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

export const InventoryMobileGroupRow = React.memo(({ 
    group, 
    style, 
    isExpanded, 
    toggleExpand,
    // getCategoryIcon removed
}: GroupRowProps) => {
    const { primaryItem, totalQuantity, aggregatedStatus, items } = group;

    return (
        <div style={style} className="px-3 pt-3 pb-1">
            <div
                onClick={toggleExpand}
                className={`
                    rounded border transition-all duration-200 overflow-hidden active:scale-[0.99]
                    ${isExpanded
                        ? 'bg-orbital-surface border-orbital-accent shadow-glow-sm'
                        : 'bg-orbital-bg border-orbital-border shadow-sm'}
                `}
            >
                <div className="p-3 flex gap-3">
                    <div className={`
                        w-10 h-10 rounded flex items-center justify-center shrink-0 transition-colors
                        ${isExpanded ? 'bg-orbital-accent text-orbital-bg' : 'bg-orbital-surface text-orbital-subtext'}
                    `}>
                        <FlaskConical size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                             <div className="text-sm font-bold text-orbital-text truncate pr-2">{primaryItem.name}</div>
                             {items.length > 1 && <span className="text-[10px] px-1.5 py-0.5 bg-orbital-surface rounded border border-orbital-border text-orbital-subtext shrink-0">{items.length}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="font-mono text-[10px] bg-orbital-surface px-1.5 py-0.5 rounded text-orbital-subtext">
                                 {primaryItem.sapCode || 'S/ SAP'}
                             </span>
                             {(aggregatedStatus.isExpired || aggregatedStatus.isLowStock) && (
                                <OrbitalBadge variant={aggregatedStatus.variant} label={aggregatedStatus.label} className="scale-90" />
                             )}
                        </div>
                    </div>
                </div>

                <div className={`
                    px-3 py-2 border-t flex justify-between items-center text-xs
                    ${isExpanded ? 'bg-orbital-accent/10 border-orbital-accent/30' : 'bg-orbital-surface/50 border-orbital-border'}
                `}>
                    <div className="flex items-center gap-1.5 text-orbital-subtext max-w-[60%]">
                        <Warehouse size={14} />
                        <span className="truncate">{group.locations.join(', ')}</span>
                    </div>
                    <div className="font-bold text-orbital-text">
                        {totalQuantity} <span className="font-normal text-orbital-subtext">{primaryItem.baseUnit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export const InventoryMobileChildRow = React.memo(({ 
    item, 
    style, 
    onActions
}: ChildRowProps) => {
    const status = getItemStatus(item);
    const controls = useAnimation();
    
    let validityInfo = formatDate(item.expiryDate);
    if (item.itemType === 'EQUIPMENT' && item.maintenanceDate) validityInfo = `Manut: ${formatDate(item.maintenanceDate)}`;
    else if (item.itemType === 'GLASSWARE' && item.glassVolume) validityInfo = item.glassVolume;

    const handleDragEnd = async ( _event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;
        if (offset < -80) {
            await controls.start({ x: -80 });
            onActions.edit(item);
            controls.start({ x: 0 });
        } else if (offset > 80) {
            await controls.start({ x: 80 });
            onActions.move(item);
            controls.start({ x: 0 });
        } else {
            controls.start({ x: 0 });
        }
    };

    return (
        <div style={style} className="px-3 pl-6 pb-1">
             <div className="absolute inset-y-1 left-4 right-3 rounded flex overflow-hidden">
                <div className="w-1/2 bg-orbital-accent flex items-center pl-4 text-orbital-bg font-bold">
                    <ArrowRightLeft size={20} />
                </div>
                <div className="w-1/2 bg-orbital-warning flex items-center justify-end pr-4 text-orbital-bg font-bold">
                    <Edit size={20} />
                </div>
             </div>

             <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ position: 'relative', zIndex: 10 }}
             >
                <div className="bg-orbital-surface rounded border border-orbital-border shadow-sm p-3">
                    <div className="flex justify-between mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <QrCode className="text-orbital-accent" size={14} />
                                <span className="font-mono text-sm font-bold text-orbital-text">{item.lotNumber}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-orbital-subtext">
                                <MapPin size={12} />
                                <span>{item.location.warehouse} {item.location.cabinet ? `• ${item.location.cabinet}` : ''}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-bold text-orbital-text">
                                 {item.quantity} <span className="text-[10px] text-orbital-subtext font-normal">{item.baseUnit}</span>
                             </div>
                             <div className={`text-[10px] ${status.isExpired ? 'text-orbital-danger font-bold' : 'text-orbital-subtext'}`}>
                                 {validityInfo}
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-orbital-border">
                        <MobileActionBtn onClick={(e: any) => { e.stopPropagation(); onActions.move(item); }} label="Movimentar" icon={<ArrowRightLeft size={16} />} />
                        <MobileActionBtn onClick={(e: any) => { e.stopPropagation(); onActions.clone(item); }} label="Clonar" icon={<Copy size={16} />} />
                        <MobileActionBtn onClick={(e: any) => { e.stopPropagation(); onActions.edit(item); }} label="Editar" icon={<Edit size={16} />} />
                        <MobileActionBtn onClick={(e: any) => { e.stopPropagation(); onActions.qr(item); }} label="Imprimir etiqueta" icon={<Printer size={16} />} />
                    </div>
                </div>
             </motion.div>
        </div>
    );
});

const ActionBtn = ({ onClick, title, icon }: any) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        title={title}
        aria-label={title}
        className="p-1.5 text-orbital-subtext hover:text-orbital-accent hover:bg-orbital-accent/10 rounded transition-all duration-200"
    >
        <span aria-hidden="true" className="flex items-center justify-center">
            {icon}
        </span>
    </button>
);

const MobileActionBtn = ({ onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        title={label}
        aria-label={label}
        className="flex items-center justify-center p-2 rounded text-orbital-subtext hover:text-orbital-text hover:bg-orbital-bg transition-colors"
    >
        <span aria-hidden="true" className="flex items-center justify-center">
            {icon}
        </span>
    </button>
);
