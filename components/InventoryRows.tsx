
import React from 'react';
import { InventoryItem } from '../types';
import { InventoryGroup } from '../hooks/useInventoryFilters';
import { getItemStatus } from '../utils/businessRules';
import { StatusBadge } from './ui/StatusBadge';
import { Badge } from './ui/Badge';
import { Tooltip } from './Tooltip';
import { formatDate } from '../utils/formatters';

// Polaris-like Grid Template (Must match InventoryTable header exactly)
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

// --- DESKTOP COMPONENTS ---

export const InventoryChildRow = React.memo(({ 
    item, 
    style,
    isSelected, 
    onActions,
    copyToClipboard,
    isLast
}: ChildRowProps) => {
    const status = getItemStatus(item);
    
    // Lógica de Exibição Contextual
    let validityContent = formatDate(item.expiryDate);
    let validityClass = status.isExpired ? 'text-danger font-bold' : 'text-text-secondary dark:text-slate-400';
    let validityTooltip = "Validade";

    if (item.itemType === 'EQUIPMENT' && item.maintenanceDate) {
        validityContent = `Manut: ${formatDate(item.maintenanceDate)}`;
        validityClass = 'text-blue-600 dark:text-blue-400 font-medium';
        validityTooltip = "Próxima Manutenção";
    } else if (item.itemType === 'GLASSWARE' && item.glassVolume) {
        validityContent = item.glassVolume;
        validityClass = 'text-text-secondary dark:text-slate-400 font-mono';
        validityTooltip = "Volume Nominal";
    }

    return (
        <div style={style} className="w-full">
            <div className={`
                relative group border-b border-border-light dark:border-border-dark transition-colors 
                ${isSelected ? 'bg-primary/5' : 'bg-surface-light dark:bg-surface-dark hover:bg-background-light dark:hover:bg-slate-800/50'}
                ${isLast ? 'border-b-0' : ''}
            `}>
                {/* Linhas de conexão visual da árvore (Tree Structure) */}
                <div className="absolute left-[20px] top-0 bottom-1/2 w-px border-l border-dashed border-border-light dark:border-slate-600 group-hover:border-primary/30 transition-colors"></div>
                <div className="absolute left-[20px] top-1/2 w-[24px] h-px border-t border-dashed border-border-light dark:border-slate-600 group-hover:border-primary/30 transition-colors"></div>

                {/* Grid Container */}
                <div className="grid h-full items-center text-sm py-0 px-4" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                    
                    {/* Col 1 (40px): Checkbox placeholder */}
                    <div></div>

                    {/* Col 2 (Produto): Lote / ID */}
                    <div className="px-2 flex items-center gap-3 overflow-hidden pl-6">
                         <div className="flex flex-col gap-0.5 min-w-0">
                             <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-text-light group-hover:text-primary transition-colors">qr_code_2</span>
                                <Tooltip content={`Lote: ${item.lotNumber}`} position="top">
                                    <span 
                                        className="font-mono text-xs font-bold text-text-main dark:text-slate-300 cursor-copy hover:text-primary transition-colors bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-transparent group-hover:border-primary/20"
                                        onClick={() => copyToClipboard(item.lotNumber, 'Lote')}
                                    >
                                        {item.lotNumber}
                                    </span>
                                </Tooltip>
                                {item.isGhost && <Badge variant="neutral">Legado</Badge>}
                             </div>
                         </div>
                    </div>

                    {/* Col 3: Category Placeholder */}
                    <div className="px-2"></div>

                    {/* Col 4: Location */}
                    <div className="px-2 truncate text-text-secondary dark:text-slate-400 text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] opacity-70">location_on</span>
                        <span className="truncate">{item.location.warehouse} {item.location.cabinet ? `› ${item.location.cabinet}` : ''}</span>
                    </div>

                    {/* Col 5: Qty */}
                    <div className="px-2 text-right font-medium text-text-main dark:text-white tabular-nums">
                        {item.quantity}
                    </div>

                    {/* Col 6: Validade */}
                    <div className={`px-2 text-right text-xs tabular-nums ${validityClass}`}>
                        <Tooltip content={validityTooltip}>
                            {validityContent}
                        </Tooltip>
                    </div>

                    {/* Col 7: Status Badge */}
                    <div className="px-2 flex justify-center">
                        {(status.isExpired || status.isLowStock) && (
                            <StatusBadge status={status} compact showIcon={false} />
                        )}
                    </div>

                    {/* Col 8: Ações */}
                    <div className="px-2 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Tooltip content="Novo Lote (Clonar)">
                                <button
                                    onClick={()=>onActions.clone(item)}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-text-secondary hover:text-primary transition-colors shadow-sm"
                                    aria-label="Clonar lote"
                                >
                                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">content_copy</span>
                                </button>
                             </Tooltip>
                             <Tooltip content="Editar">
                                <button
                                    onClick={()=>onActions.edit(item)}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-text-secondary hover:text-primary transition-colors shadow-sm"
                                    aria-label="Editar lote"
                                >
                                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">edit</span>
                                </button>
                             </Tooltip>
                             <Tooltip content="Movimentar">
                                <button
                                    onClick={()=>onActions.move(item)}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-text-secondary hover:text-primary transition-colors shadow-sm"
                                    aria-label="Movimentar lote"
                                >
                                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">swap_horiz</span>
                                </button>
                             </Tooltip>
                        </div>
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
    getCategoryIcon: (cat: string) => string;
    copyToClipboard: (text: string, label: string) => void;
}

export const InventoryGroupRow = React.memo(({ 
    group, 
    style,
    isExpanded, 
    toggleExpand, 
    selectedChildIds,
    onSelectGroup,
    getCategoryIcon,
    copyToClipboard
}: GroupRowProps) => {
    const { primaryItem, totalQuantity, aggregatedStatus, items } = group;
    const allSelected = items.every(i => selectedChildIds.has(i.id));
    const someSelected = items.some(i => selectedChildIds.has(i.id));
    const indeterminate = someSelected && !allSelected;

    return (
        <div style={style} className="w-full">
            <div className={`
                h-full border-b border-border-light dark:border-border-dark transition-colors cursor-pointer group
                ${isExpanded ? 'bg-background-light dark:bg-slate-800/50' : 'bg-surface-light dark:bg-surface-dark hover:bg-background-light dark:hover:bg-slate-800/20'}
            `} onClick={toggleExpand}>
                <div className="grid h-full items-center px-4 text-sm py-0" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                    
                    {/* Checkbox */}
                    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                            ref={input => { if (input) input.indeterminate = indeterminate; }}
                            className="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-border-light dark:border-border-dark rounded focus:ring-primary cursor-pointer transition-colors" 
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) => onSelectGroup(items.map(i => i.id), e.target.checked)}
                        />
                    </div>

                    {/* Product Name */}
                    <div className="px-2 overflow-hidden">
                        <div className="flex items-center gap-3">
                             <div className={`
                                p-1.5 rounded-lg border transition-all duration-200
                                ${isExpanded 
                                    ? 'bg-white dark:bg-slate-700 text-primary border-primary/30 shadow-sm' 
                                    : 'bg-background-light dark:bg-slate-800 text-text-secondary border-transparent group-hover:bg-white dark:group-hover:bg-slate-700'} 
                             `}>
                                <span className="material-symbols-outlined text-[20px]">{getCategoryIcon(primaryItem.category)}</span>
                             </div>
                             <div className="flex flex-col min-w-0">
                                 <div 
                                    className="font-bold text-text-main dark:text-white truncate text-sm"
                                    title={primaryItem.name}
                                 >
                                     {primaryItem.name}
                                 </div>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span 
                                        className="text-[10px] font-mono text-text-secondary dark:text-slate-400 cursor-copy hover:text-primary transition-colors bg-background-light dark:bg-slate-700/50 px-1.5 rounded border border-transparent hover:border-primary/20"
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(primaryItem.sapCode, 'SKU'); }}
                                    >
                                        {primaryItem.sapCode || 'N/A'}
                                    </span>
                                    {items.length > 1 && (
                                        <span className="text-[10px] px-1.5 py-px rounded-full bg-border-light dark:bg-slate-700 text-text-secondary dark:text-slate-300 font-bold border border-border-light dark:border-slate-600">
                                            {items.length} lotes
                                        </span>
                                    )}
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Category */}
                    <div className="px-2">
                         <Badge variant="neutral">{primaryItem.category}</Badge>
                    </div>

                    {/* Locations */}
                    <div className="px-2 text-xs text-text-secondary dark:text-slate-400 truncate" title={group.locations.join(', ')}>
                        {group.locations.length === 1 ? group.locations[0] : `${group.locations.length} locais`}
                    </div>

                    {/* Total Quantity */}
                    <div className="px-2 text-right">
                         <span className="font-bold text-text-main dark:text-white tabular-nums">
                            {totalQuantity.toLocaleString('pt-BR')}
                         </span>
                         <span className="text-xs text-text-secondary ml-1 lowercase">{primaryItem.baseUnit}</span>
                    </div>

                    {/* Validity Info */}
                    <div className="px-2 text-right text-xs">
                        {aggregatedStatus.isExpired ? (
                             <span className="text-danger-text font-bold bg-danger-bg dark:bg-danger/10 px-2 py-0.5 rounded-full border border-danger/20">Vencidos</span>
                        ) : (
                             <span className="text-text-light opacity-50">--</span>
                        )}
                    </div>

                    {/* Status */}
                    <div className="px-2 flex justify-center">
                        <StatusBadge status={aggregatedStatus} compact />
                    </div>

                    {/* Expand Icon */}
                    <div className="px-2 text-right">
                         <span className={`
                            material-symbols-outlined text-text-light transition-transform duration-200 
                            ${isExpanded ? 'rotate-90 text-primary' : 'group-hover:text-text-secondary'}
                         `}>
                             chevron_right
                         </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- MOBILE COMPONENTS ---

export const InventoryMobileGroupRow = React.memo(({ 
    group, 
    style, 
    isExpanded, 
    toggleExpand,
    getCategoryIcon
}: GroupRowProps) => {
    const { primaryItem, totalQuantity, aggregatedStatus, items } = group;

    return (
        <div style={style} className="w-full px-4 pt-4 pb-1">
             <div 
                className={`
                    rounded-xl border shadow-sm transition-all duration-200 overflow-hidden
                    ${isExpanded 
                        ? 'bg-white dark:bg-slate-800 border-primary ring-1 ring-primary/20' 
                        : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark active:scale-[0.98]'
                    }
                `}
                onClick={toggleExpand}
            >
                <div className="p-3 flex items-start gap-3">
                    {/* Icon Box */}
                    <div className={`
                        shrink-0 size-11 rounded-lg flex items-center justify-center border shadow-sm
                        ${isExpanded 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-background-light dark:bg-slate-700 text-text-secondary dark:text-slate-300 border-border-light dark:border-slate-600'}
                    `}>
                        <span className="material-symbols-outlined">{getCategoryIcon(primaryItem.category)}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                             <h3 className="font-bold text-text-main dark:text-white truncate text-sm pr-2 leading-tight">
                                 {primaryItem.name}
                             </h3>
                             {items.length > 1 && (
                                 <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-text-secondary border border-slate-200 dark:border-slate-600">
                                     {items.length}
                                 </span>
                             )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                             <span className="text-[10px] font-mono text-text-secondary bg-slate-100 dark:bg-slate-900/50 px-1.5 rounded border border-slate-200 dark:border-slate-700">
                                 {primaryItem.sapCode || 'S/ SAP'}
                             </span>
                             {(aggregatedStatus.isExpired || aggregatedStatus.isLowStock) && (
                                <StatusBadge status={aggregatedStatus} compact className="!text-[9px]" />
                             )}
                        </div>
                    </div>
                </div>

                {/* Footer Strip */}
                <div className={`
                    px-3 py-2 border-t border-dashed flex justify-between items-center text-xs
                    ${isExpanded ? 'border-primary/20 bg-primary/5' : 'border-border-light dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50'}
                `}>
                    <div className="flex items-center gap-1 text-text-secondary dark:text-slate-400">
                        <span className="material-symbols-outlined text-[14px]">warehouse</span>
                        <span className="max-w-[140px] truncate">{group.locations.join(', ')}</span>
                    </div>
                    <div className="font-bold text-text-main dark:text-white bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-600">
                        {totalQuantity} <span className="font-normal text-text-light text-[10px]">{primaryItem.baseUnit}</span>
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
    
    // Lógica Contextual Mobile
    let validityInfo = formatDate(item.expiryDate);
    if (item.itemType === 'EQUIPMENT' && item.maintenanceDate) validityInfo = `Manut: ${formatDate(item.maintenanceDate)}`;
    else if (item.itemType === 'GLASSWARE' && item.glassVolume) validityInfo = item.glassVolume;

    return (
        <div style={style} className="w-full px-4 pl-8 pb-2 relative">
             {/* Tree Lines */}
             <div className="absolute left-[24px] top-0 bottom-0 w-px border-l border-dashed border-slate-300 dark:border-slate-700"></div>
             <div className="absolute left-[24px] top-[28px] w-4 h-px border-t border-dashed border-slate-300 dark:border-slate-700"></div>

             <div className="bg-white dark:bg-slate-800 rounded-lg border border-border-light dark:border-slate-700 p-3 shadow-sm relative ml-1">
                {/* Lote Header */}
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-primary bg-primary/10 p-0.5 rounded">qr_code_2</span>
                            <span className="font-mono text-sm font-bold text-text-main dark:text-white tracking-wide">{item.lotNumber}</span>
                        </div>
                        <span className="text-[10px] text-text-secondary dark:text-gray-400 block mt-1 ml-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {item.location.warehouse} {item.location.cabinet ? `• ${item.location.cabinet}` : ''}
                        </span>
                    </div>
                    <div className="text-right">
                         <div className="font-bold text-text-main dark:text-white text-sm">
                             {item.quantity} <span className="text-xs font-normal text-text-secondary">{item.baseUnit}</span>
                         </div>
                         <div className={`text-[10px] font-medium mt-0.5 ${status.isExpired ? 'text-red-500 font-bold' : 'text-text-light'}`}>
                             {validityInfo}
                         </div>
                    </div>
                </div>

                {/* Actions Toolbar */}
                <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-700">
                     <button onClick={()=>onActions.move(item)} className="flex flex-col items-center justify-center text-text-secondary hover:text-primary py-1 active:bg-slate-50 dark:active:bg-slate-700 rounded transition-colors group">
                         <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform" aria-hidden="true">swap_horiz</span>
                         <span className="text-[9px] mt-0.5 font-medium">Mover</span>
                     </button>
                     <button onClick={()=>onActions.clone(item)} className="flex flex-col items-center justify-center text-text-secondary hover:text-primary py-1 active:bg-slate-50 dark:active:bg-slate-700 rounded transition-colors group">
                         <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" aria-hidden="true">content_copy</span>
                         <span className="text-[9px] mt-0.5 font-medium">Clonar</span>
                     </button>
                     <button onClick={()=>onActions.edit(item)} className="flex flex-col items-center justify-center text-text-secondary hover:text-primary py-1 active:bg-slate-50 dark:active:bg-slate-700 rounded transition-colors group">
                         <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" aria-hidden="true">edit</span>
                         <span className="text-[9px] mt-0.5 font-medium">Editar</span>
                     </button>
                     <button onClick={()=>onActions.qr(item)} className="flex flex-col items-center justify-center text-text-secondary hover:text-primary py-1 active:bg-slate-50 dark:active:bg-slate-700 rounded transition-colors group">
                         <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" aria-hidden="true">print</span>
                         <span className="text-[9px] mt-0.5 font-medium">QR</span>
                     </button>
                </div>
             </div>
        </div>
    );
});
