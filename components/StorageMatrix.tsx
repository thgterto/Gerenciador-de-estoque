
import React, { useState, useMemo } from 'react';
import { InventoryItem, RiskFlags } from '../types';
import { RISK_CONFIG, getItemStatus, analyzeLocation } from '../utils/businessRules';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { normalizeStr } from '../utils/stringUtils';
import { InventoryService } from '../services/InventoryService';
import { useAlert } from '../context/AlertContext';

interface Props {
  items: InventoryItem[];
}

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8];

interface StorageCellProps {
    cellId: string;
    item?: InventoryItem;
    isSelected: boolean;
    auditMode: boolean;
    onSelect: (item: InventoryItem | null) => void;
    // DnD Props
    onDragStart: (e: React.DragEvent, item: InventoryItem) => void;
    onDrop: (e: React.DragEvent, targetCellId: string) => void;
}

// Sub-componente otimizado para células
const StorageCell = React.memo(({ cellId, item, isSelected, auditMode, onSelect, onDragStart, onDrop }: StorageCellProps) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
    let cellClass = "bg-background-light dark:bg-slate-800/30 border-border-light dark:border-slate-700 border-dashed";
    let textClass = "text-text-light";
    
    if (item) {
        const status = getItemStatus(item);
        // Item Presente (Normal)
        cellClass = "bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark border-solid shadow-sm hover:border-primary/50 cursor-grab active:cursor-grabbing";
        textClass = "text-text-main dark:text-white";

        if (auditMode) {
            if (status.isExpired) {
                // Audit: Vencido
                cellClass = "bg-danger-bg dark:bg-danger/20 border-danger/50 ring-1 ring-danger/30";
                textClass = "text-danger-text dark:text-red-200";
            } else if (status.isLowStock) {
                // Audit: Baixo Estoque
                cellClass = "bg-warning-bg dark:bg-warning/20 border-warning/50 ring-1 ring-warning/30";
                textClass = "text-warning-text dark:text-amber-200";
            } else {
                // Audit: OK
                cellClass = "bg-success-bg dark:bg-success/20 border-success/50";
                textClass = "text-success-text dark:text-emerald-200";
            }
        } else {
            // Normal Mode: Item Presente
            cellClass = "bg-white dark:bg-slate-700 border-l-4 border-l-primary border-y border-r border-border-light dark:border-slate-600";
        }
    }

    if (isSelected) {
        cellClass = "bg-primary text-white border-primary ring-2 ring-offset-2 ring-primary z-10 shadow-lg transform scale-105";
        textClass = "text-white";
    }

    // Drag Over Visuals
    if (isDragOver && !item) {
        cellClass = "bg-primary/10 border-primary border-dashed scale-105 transition-transform z-20";
    }

    const handleDragOver = (e: React.DragEvent) => {
        if (!item) {
            e.preventDefault(); // Permitir drop apenas se vazio
            setIsDragOver(true);
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!item) {
            onDrop(e, cellId);
        }
    };

    return (
        <div 
            onClick={() => onSelect(item || null)}
            draggable={!!item}
            onDragStart={(e) => item && onDragStart(e, item)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                rounded-lg border p-2 flex flex-col justify-between transition-all duration-200 relative overflow-hidden group
                ${cellClass}
            `}
        >
            <div className="flex justify-between items-start pointer-events-none">
                <span className={`text-[10px] font-bold opacity-60 ${isSelected ? 'text-white/80' : ''}`}>{cellId}</span>
                {item && !isSelected && !auditMode && (
                    <div className="size-1.5 rounded-full bg-primary/40"></div>
                )}
                 {item && auditMode && (
                    <div className={`size-2 rounded-full ${getItemStatus(item).isExpired ? 'bg-danger animate-pulse' : 'bg-success'}`}></div>
                )}
            </div>
            {item ? (
                <>
                    <div className={`text-[10px] font-bold truncate leading-tight mt-1 ${textClass}`} title={item.name}>{item.name}</div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="material-symbols-outlined text-lg text-primary/40">add</span>
                </div>
            )}
        </div>
    );
});

export const StorageMatrix: React.FC<Props> = ({ items }) => {
    const { addToast } = useAlert();
    const [selectedLocKey, setSelectedLocKey] = useState<string | null>(null);
    const [auditMode, setAuditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    
    // Agrupa itens por Local > Armário
    const locations = useMemo<Record<string, InventoryItem[]>>(() => {
        const groups: Record<string, InventoryItem[]> = {};
        items.forEach(item => {
            const warehouse = item.location.warehouse || 'Geral';
            const cabinet = item.location.cabinet || 'Área Comum';
            const key = `${warehouse} > ${cabinet}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }, [items]);

    // Itens do local selecionado
    const selectedLocationItems = useMemo((): InventoryItem[] => {
        return selectedLocKey ? (locations[selectedLocKey] || []) : [];
    }, [selectedLocKey, locations]);

    // Mapeia itens para o Grid e vice-versa
    const { gridMap, reverseGridMap, unassignedItems } = useMemo(() => {
        const map: Record<string, InventoryItem> = {};
        const revMap: Record<string, string> = {};
        const unassigned: InventoryItem[] = [];
        
        selectedLocationItems.forEach(item => {
            const pos = normalizeStr(item.location.position || '').toUpperCase();
            // Tenta extrair letra e número (ex: A1, A-1)
            const match = pos.match(/([A-F])[\W_]?([1-8])/);
            
            if (match) {
                const key = `${match[1]}${match[2]}`; // Ex: A1
                // Prioridade para o item já existente ou lógica de sobreposição
                map[key] = item;
                revMap[item.id] = key;
            } else {
                unassigned.push(item);
            }
        });
        return { gridMap: map, reverseGridMap: revMap, unassignedItems: unassigned };
    }, [selectedLocationItems]);

    // Célula ativa baseada no item selecionado
    const activeCellId = useMemo(() => {
        if (!selectedItem) return null;
        return reverseGridMap[selectedItem.id] || null;
    }, [selectedItem, reverseGridMap]);

    // --- DnD Handlers ---
    const handleDragStart = (e: React.DragEvent, item: InventoryItem) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ itemId: item.id }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = async (e: React.DragEvent, targetCellId: string) => {
        try {
            const raw = e.dataTransfer.getData("application/json");
            if (!raw) return;
            const { itemId } = JSON.parse(raw);
            
            if (itemId) {
                await InventoryService.updateItemPosition(itemId, targetCellId);
                addToast('Movido', 'success', `Item movido para ${targetCellId}`);
            }
        } catch (error) {
            console.error("Drop failed", error);
            addToast('Erro', 'error', 'Falha ao mover item.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden animate-fade-in">
            {/* Header da Página */}
            <div className="px-6 md:px-8 py-5 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border-light dark:border-border-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                 <div>
                    <h1 className="text-2xl font-bold text-text-main dark:text-white flex items-center gap-3">
                        Matriz de Armazenamento
                        {selectedLocKey && (
                            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded border border-primary/20 font-mono">
                                {selectedLocKey}
                            </span>
                        )}
                    </h1>
                 </div>
                 <div className="flex gap-3">
                    {selectedLocKey && (
                        <Button variant="ghost" onClick={() => { setSelectedLocKey(null); setSelectedItem(null); }}>
                            Voltar para Lista
                        </Button>
                    )}
                    <Button 
                        id="tour-audit-btn"
                        onClick={() => setAuditMode(!auditMode)}
                        variant={auditMode ? 'warning' : 'white'}
                        icon={auditMode ? 'visibility' : 'visibility_off'}
                        className={auditMode ? 'ring-2 ring-warning border-transparent font-bold' : ''}
                    >
                        {auditMode ? 'Modo Auditoria ON' : 'Modo Auditoria'}
                    </Button>
                 </div>
            </div>
            
            <div className="flex-1 overflow-hidden p-4 md:p-8 relative">
                {!selectedLocKey ? (
                    /* VIEW 1: SELEÇÃO DE LOCAL (CARDS) */
                    <div className="overflow-y-auto h-full pr-2 pb-10 custom-scrollbar">
                        {Object.keys(locations).length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-text-secondary opacity-60">
                                <span className="material-symbols-outlined text-6xl mb-4 text-border-DEFAULT">shelves</span>
                                <p>Nenhum local ativo.</p>
                            </div>
                        ) : (
                            <div id="tour-storage-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {Object.entries(locations).map(([key, locItems]) => {
                                    const analysis = analyzeLocation(locItems as InventoryItem[]);
                                    const [warehouse, cabinet] = key.split(' > ');
                                    const hasIssues = analysis.expiredCount > 0 || analysis.conflict || analysis.lowStockCount > 0;
                                    
                                    let cardBorderClass = "";
                                    let cardBgClass = "";
                                    
                                    if (auditMode && hasIssues) {
                                        if (analysis.expiredCount > 0) {
                                            cardBorderClass = "ring-2 ring-danger border-danger/50";
                                            cardBgClass = "bg-danger-bg dark:bg-danger/10";
                                        } else if (analysis.lowStockCount > 0) {
                                            cardBorderClass = "ring-2 ring-warning border-warning/50";
                                            cardBgClass = "bg-warning-bg dark:bg-warning/10";
                                        }
                                    }

                                    return (
                                        <Card 
                                            key={key}
                                            variant="interactive"
                                            padding="p-5"
                                            onClick={() => setSelectedLocKey(key)}
                                            className={`flex flex-col gap-4 transition-all duration-200 ${cardBorderClass} ${cardBgClass}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg bg-background-light dark:bg-slate-700 shadow-sm text-primary border border-border-light dark:border-slate-600`}>
                                                        <span className="material-symbols-outlined text-[24px]">
                                                            {cabinet?.toLowerCase().includes('geladeira') || cabinet?.toLowerCase().includes('freezer') ? 'ac_unit' : 'meeting_room'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-text-main dark:text-white text-base">{cabinet}</h3>
                                                        <p className="text-xs text-text-secondary dark:text-gray-400">{warehouse}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Indicadores de Auditoria */}
                                                {auditMode ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        {analysis.expiredCount > 0 && (
                                                            <span className="bg-danger-bg text-danger-text text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-danger/20">
                                                                {analysis.expiredCount} Vencidos
                                                            </span>
                                                        )}
                                                        {analysis.lowStockCount > 0 && (
                                                            <span className="bg-warning-bg text-warning-text text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-warning/20">
                                                                {analysis.lowStockCount} Baixo
                                                            </span>
                                                        )}
                                                        {analysis.conflict && (
                                                            <span className="bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full" title={analysis.conflict}>
                                                                Risco
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    analysis.conflict && <span className="text-danger material-symbols-outlined" title={analysis.conflict}>warning</span>
                                                )}
                                            </div>

                                            <div className="flex justify-between text-[10px] text-text-secondary dark:text-gray-400 mt-0.5">
                                                <span className="font-medium bg-surface-light dark:bg-surface-dark px-2 py-0.5 rounded border border-border-light dark:border-border-dark">
                                                    {analysis.count} Itens Armazenados
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-border-light/50 dark:border-gray-700/50">
                                                {analysis.activeRisks.length > 0 ? (
                                                    analysis.activeRisks.slice(0, 5).map(r => (
                                                        <div key={r} className={`size-5 rounded-full ${RISK_CONFIG[r].color} text-white flex items-center justify-center text-[10px] shadow-sm ring-1 ring-white/20`} title={RISK_CONFIG[r].label}>
                                                            <span className="material-symbols-outlined text-[12px]">{RISK_CONFIG[r].icon}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-text-light italic flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">check</span> Seguro
                                                    </span>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* VIEW 2: GRID DETALHADO (8x6) */
                    <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-4 min-h-0">
                            {/* Container do Grid */}
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm p-6 overflow-auto custom-scrollbar flex-1 flex flex-col justify-center relative">
                                <div className="min-w-[600px] flex flex-col items-center">
                                    {/* Header Colunas */}
                                    <div className="flex mb-3 ml-8 w-full max-w-4xl gap-3">
                                        {COLS.map(col => (
                                            <div key={col} className="flex-1 text-center text-xs font-bold text-text-secondary dark:text-gray-500 uppercase tracking-widest">{col}</div>
                                        ))}
                                    </div>
                                    <div className="flex w-full max-w-4xl relative gap-3">
                                        {/* Header Linhas */}
                                        <div className="flex flex-col justify-around w-6 gap-3">
                                            {ROWS.map(row => (
                                                <div key={row} className="h-full flex items-center justify-center text-xs font-bold text-text-secondary dark:text-gray-500 uppercase">{row}</div>
                                            ))}
                                        </div>
                                        {/* Células */}
                                        <div className="flex-1 grid grid-cols-8 grid-rows-6 gap-3 h-[500px]">
                                            {ROWS.map(row => (
                                                COLS.map(col => {
                                                    const cellId = `${row}${col}`;
                                                    return (
                                                        <StorageCell 
                                                            key={cellId}
                                                            cellId={cellId}
                                                            item={gridMap[cellId]}
                                                            isSelected={activeCellId === cellId}
                                                            auditMode={auditMode}
                                                            onSelect={setSelectedItem}
                                                            onDragStart={handleDragStart}
                                                            onDrop={handleDrop}
                                                        />
                                                    );
                                                })
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Legenda (Opcional, para clareza) */}
                            <div className="flex gap-4 text-[10px] text-text-secondary justify-center">
                                <div className="flex items-center gap-1"><div className="size-3 bg-white border-l-4 border-l-primary border border-slate-200"></div> Ocupado</div>
                                <div className="flex items-center gap-1"><div className="size-3 bg-slate-50 border border-dashed border-slate-300"></div> Livre</div>
                                <div className="flex items-center gap-1 opacity-60"><span className="material-symbols-outlined text-[14px]">drag_indicator</span> Arraste para mover</div>
                                {auditMode && (
                                    <>
                                        <div className="flex items-center gap-1"><div className="size-3 bg-danger-bg border border-danger"></div> Vencido</div>
                                        <div className="flex items-center gap-1"><div className="size-3 bg-warning-bg border border-warning"></div> Baixo</div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Painel Lateral de Detalhes */}
                        <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 h-full overflow-hidden">
                            <Card padding="p-0" className="flex flex-col h-full animate-slide-left overflow-hidden bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark">
                                {selectedItem ? (
                                    <div className="flex flex-col h-full">
                                        <div className="p-5 border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-slate-800/50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-primary/10">
                                                    {reverseGridMap[selectedItem.id] || 'S/P'}
                                                </div>
                                                <div className="flex gap-1">
                                                    {Object.keys(selectedItem.risks).filter(k => (selectedItem.risks as any)[k]).map(r => (
                                                         <span key={r} className={`size-5 rounded-full ${RISK_CONFIG[r as keyof RiskFlags].color} text-white flex items-center justify-center text-[10px]`} title={RISK_CONFIG[r as keyof RiskFlags].label}>
                                                             <span className="material-symbols-outlined text-[12px]">{RISK_CONFIG[r as keyof RiskFlags].icon}</span>
                                                         </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-text-main dark:text-white text-lg leading-tight" title={selectedItem.name}>{selectedItem.name}</h3>
                                            <p className="text-xs text-text-secondary font-mono mt-1">{selectedItem.sapCode || 'Sem código'}</p>
                                        </div>
                                        
                                        <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-background-light dark:bg-slate-800 p-3 rounded-lg border border-border-light dark:border-border-dark">
                                                    <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Qtd</p>
                                                    <p className="font-bold text-lg text-text-main dark:text-white leading-none">{selectedItem.quantity} <span className="text-sm font-normal text-text-light">{selectedItem.baseUnit}</span></p>
                                                </div>
                                                <div className="bg-background-light dark:bg-slate-800 p-3 rounded-lg border border-border-light dark:border-border-dark">
                                                    <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Lote</p>
                                                    <p className="font-bold text-sm text-text-main dark:text-white truncate" title={selectedItem.lotNumber}>{selectedItem.lotNumber}</p>
                                                </div>
                                            </div>
                                            
                                            <div className={`p-4 rounded-lg border flex items-center gap-3 ${getItemStatus(selectedItem).isExpired ? 'bg-danger-bg border-danger/30 text-danger-text' : 'bg-background-light dark:bg-slate-800 border-border-light dark:border-border-dark'}`}>
                                                 <div className={`p-2 rounded-full ${getItemStatus(selectedItem).isExpired ? 'bg-danger text-white' : 'bg-surface-light dark:bg-slate-700 text-text-secondary'}`}>
                                                    <span className="material-symbols-outlined text-lg">event</span>
                                                 </div>
                                                 <div>
                                                     <p className="text-[10px] uppercase font-bold opacity-70">Validade</p>
                                                     <p className="font-bold text-sm">
                                                        {selectedItem.expiryDate ? new Date(selectedItem.expiryDate).toLocaleDateString() : 'N/A'}
                                                     </p>
                                                 </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wide border-b border-border-light dark:border-border-dark pb-1">Localização Completa</h4>
                                                <div className="text-sm text-text-main dark:text-slate-300 space-y-1 bg-background-light dark:bg-slate-800 p-3 rounded-lg border border-border-light dark:border-border-dark">
                                                    <p><span className="text-text-secondary text-xs">Armazém:</span> {selectedItem.location.warehouse}</p>
                                                    <p><span className="text-text-secondary text-xs">Armário:</span> {selectedItem.location.cabinet || '-'}</p>
                                                    <p><span className="text-text-secondary text-xs">Prateleira:</span> {selectedItem.location.shelf || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 border-t border-border-light dark:border-border-dark bg-background-light/30 dark:bg-slate-800/30">
                                            <Button className="w-full" variant="outline" onClick={() => setSelectedItem(null)}>Fechar Detalhes</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary dark:text-gray-500 p-6">
                                        <div className="bg-background-light dark:bg-slate-800 p-6 rounded-full mb-4 shadow-inner border border-border-light dark:border-border-dark">
                                            <span className="material-symbols-outlined text-5xl opacity-20">touch_app</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">Nenhum item selecionado</h3>
                                        <p className="text-sm opacity-70 max-w-[200px]">Clique em um quadrado no grid para ver os detalhes do item.</p>
                                    </div>
                                )}
                                
                                {/* Lista de Não Posicionados */}
                                {unassignedItems.length > 0 && (
                                    <div className="border-t border-border-light dark:border-border-dark bg-warning-bg/10 dark:bg-warning/5 flex flex-col max-h-[200px]">
                                        <div className="px-5 py-3 border-b border-border-light/50 dark:border-border-dark/50 flex justify-between items-center">
                                            <h4 className="text-xs font-bold uppercase text-warning-text tracking-wide flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">warning</span>
                                                Sem Posição ({unassignedItems.length})
                                            </h4>
                                        </div>
                                        <div className="overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                            {unassignedItems.map(item => (
                                                <div 
                                                    key={item.id} 
                                                    onClick={() => setSelectedItem(item)}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, item)}
                                                    className={`
                                                        p-2.5 rounded-lg border text-xs shadow-sm cursor-grab group transition-all
                                                        ${selectedItem?.id === item.id 
                                                            ? 'bg-white dark:bg-slate-800 border-primary ring-1 ring-primary' 
                                                            : 'bg-white dark:bg-slate-800 border-border-light dark:border-border-dark hover:border-primary'}
                                                    `}
                                                >
                                                    <div className="font-bold truncate text-text-main dark:text-white group-hover:text-primary transition-colors">{item.name}</div>
                                                    <div className="text-text-secondary dark:text-gray-400 flex justify-between mt-1">
                                                        <span className="font-mono bg-background-light dark:bg-slate-700 px-1.5 rounded text-[10px] border border-border-light dark:border-border-dark">{item.lotNumber}</span>
                                                        <span className="font-medium">{item.quantity} {item.baseUnit}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
};
