
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { InventoryItem } from '../types';
import { getItemStatus, analyzeLocation } from '../utils/businessRules';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PageHeader } from './ui/PageHeader';
import { normalizeStr } from '../utils/stringUtils';
import { InventoryService } from '../services/InventoryService';
import { useAlert } from '../context/AlertContext';
import { Badge } from './ui/Badge';
import { InventoryMobileChildRow } from './InventoryRows';
import { useAuth } from '../context/AuthContext';
import { PageContainer } from './ui/PageContainer';

interface Props {
  items: InventoryItem[];
  onActions?: {
    edit: (item: InventoryItem) => void;
    move: (item: InventoryItem) => void;
    delete: (id: string, name: string) => void;
    request: () => void;
    qr: (item: InventoryItem) => void;
    viewHistory: (item: InventoryItem) => void;
    clone: (item: InventoryItem) => void;
  };
}

const STANDARD_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STANDARD_COLS = [1, 2, 3, 4, 5, 6, 7, 8];

const CHEMICAL_ROWS = ['A', 'B', 'C'];
const CHEMICAL_COLS = [1, 2, 3];

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
                cellClass = "bg-danger-bg dark:bg-danger/20 border-danger/50 ring-1 ring-danger/30";
                textClass = "text-danger-text dark:text-red-200";
            } else if (status.isLowStock) {
                cellClass = "bg-warning-bg dark:bg-warning/20 border-warning/50 ring-1 ring-warning/30";
                textClass = "text-warning-text dark:text-amber-200";
            } else {
                cellClass = "bg-success-bg dark:bg-success/20 border-success/50";
                textClass = "text-success-text dark:text-emerald-200";
            }
        } else {
            cellClass = "bg-white dark:bg-slate-700 border-l-4 border-l-primary border-y border-r border-border-light dark:border-slate-600";
        }
    }

    if (isSelected) {
        cellClass = "bg-primary text-white border-primary ring-2 ring-offset-2 ring-primary z-10 shadow-lg transform scale-105";
        textClass = "text-white";
    }

    if (isDragOver && !item) {
        cellClass = "bg-primary/10 border-primary border-dashed scale-105 transition-transform z-20";
    }

    const handleDragOver = (e: React.DragEvent) => {
        if (!item) {
            e.preventDefault(); 
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item || null);
        }
    };

    return (
        <div 
            onClick={() => onSelect(item || null)}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            draggable={!!item}
            onDragStart={(e) => item && onDragStart(e, item)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                rounded-lg border p-2 flex flex-col justify-between transition-all duration-200 relative overflow-hidden group min-h-[70px]
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

export const StorageMatrix: React.FC<Props> = ({ items, onActions }) => {
    const { addToast } = useAlert();
    const { hasRole } = useAuth();
    const [selectedLocKey, setSelectedLocKey] = useState<string | null>(null);
    const [auditMode, setAuditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>(() => window.innerWidth < 768 ? 'LIST' : 'GRID');
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
        };
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
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

    const isChemicalStorage = useMemo(() => {
        if (!selectedLocKey) return false;
        const [warehouse] = selectedLocKey.split(' > ');
        return normalizeStr(warehouse).includes('quimico') || normalizeStr(warehouse).includes('corrosivo');
    }, [selectedLocKey]);

    const activeRows = isChemicalStorage ? CHEMICAL_ROWS : STANDARD_ROWS;
    const activeCols = isChemicalStorage ? CHEMICAL_COLS : STANDARD_COLS;

    const locationStats = useMemo(() => {
        const stats: Record<string, ReturnType<typeof analyzeLocation>> = {};
        Object.keys(locations).forEach(key => {
            stats[key] = analyzeLocation(locations[key]);
        });
        return stats;
    }, [locations]);

    // Itens do local selecionado
    const selectedLocationItems = useMemo((): InventoryItem[] => {
        return selectedLocKey ? (locations[selectedLocKey] || []) : [];
    }, [selectedLocKey, locations]);

    // Mapeia itens para o Grid e vice-versa
    const { gridMap, reverseGridMap } = useMemo(() => {
        const map: Record<string, InventoryItem> = {};
        const revMap: Record<string, string> = {};
        const unassigned: InventoryItem[] = [];
        
        selectedLocationItems.forEach(item => {
            const pos = normalizeStr(item.location.position || '').toUpperCase();
            const match = pos.match(/([A-F])[\W_]?([1-8])/);
            
            if (match) {
                const key = `${match[1]}${match[2]}`; 
                map[key] = item;
                revMap[item.id] = key;
            } else {
                unassigned.push(item);
            }
        });
        return { gridMap: map, reverseGridMap: revMap };
    }, [selectedLocationItems]);

    const activeCellId = useMemo(() => {
        if (!selectedItem) return null;
        return reverseGridMap[selectedItem.id] || null;
    }, [selectedItem, reverseGridMap]);

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

    const copyToClipboard = useCallback((text: string, label: string) => {
        if(!text) return;
        navigator.clipboard.writeText(text);
        addToast(`${label} copiado!`, 'success');
    }, [addToast]);

    return (
        <PageContainer scrollable={false} className="animate-fade-in">
            <div className="pb-4 border-b border-border-light dark:border-border-dark mb-4">
                 <PageHeader 
                    title={selectedLocKey ? (selectedLocKey.split(' > ')[1] || selectedLocKey) : "Locais de Armazenamento"}
                    description={selectedLocKey ? `${selectedLocKey.split(' > ')[0]}` : "Selecione um local para gerenciar a disposição física."}
                    className="mb-0"
                 >
                    {selectedLocKey && (
                        <>
                            <Button variant="ghost" onClick={() => { setSelectedLocKey(null); setSelectedItem(null); }}>
                                Voltar
                            </Button>
                            {/* Toggle View Mode Button */}
                             <Button 
                                onClick={() => setViewMode(viewMode === 'GRID' ? 'LIST' : 'GRID')}
                                variant="white"
                                icon={viewMode === 'GRID' ? 'list' : 'grid_view'}
                                title="Alternar Visualização"
                            >
                                {viewMode === 'GRID' ? 'Lista' : 'Grid'}
                            </Button>
                            <Button 
                                id="tour-audit-btn"
                                onClick={() => setAuditMode(!auditMode)}
                                variant={auditMode ? 'warning' : 'white'}
                                icon={auditMode ? 'visibility' : 'visibility_off'}
                                className={`hidden sm:flex ${auditMode ? 'ring-2 ring-warning border-transparent font-bold' : ''}`}
                            >
                                {auditMode ? 'Audit ON' : 'Audit'}
                            </Button>
                        </>
                    )}
                 </PageHeader>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                {!selectedLocKey ? (
                    <div className="overflow-y-auto h-full pr-2 pb-10 custom-scrollbar">
                        {Object.keys(locations).length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-text-secondary opacity-60">
                                <span className="material-symbols-outlined text-6xl mb-4 text-border-DEFAULT">shelves</span>
                                <p>Nenhum local ativo.</p>
                            </div>
                        ) : (
                            <div id="tour-storage-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {Object.entries(locations).map(([key]) => {
                                    const analysis = locationStats[key];
                                    const [warehouse, cabinet] = key.split(' > ');
                                    return (
                                        <Card 
                                            key={key}
                                            variant="interactive"
                                            padding="p-5"
                                            onClick={() => setSelectedLocKey(key)}
                                            className="flex flex-col gap-4 transition-all duration-200"
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
                                            </div>
                                            <div className="flex justify-between text-[10px] text-text-secondary dark:text-gray-400 mt-0.5">
                                                <span className="font-medium bg-surface-light dark:bg-surface-dark px-2 py-0.5 rounded border border-border-light dark:border-border-dark">
                                                    {analysis.count} Itens
                                                </span>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-4 min-h-0">
                            {viewMode === 'GRID' ? (
                                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm p-6 overflow-auto custom-scrollbar flex-1 flex flex-col justify-center relative">
                                    <div className="min-w-[600px] flex flex-col items-center">
                                        <div className="flex mb-3 ml-8 w-full max-w-4xl gap-3">
                                            {activeCols.map(col => (
                                                <div key={col} className="flex-1 text-center text-xs font-bold text-text-secondary dark:text-gray-500 uppercase tracking-widest">{col}</div>
                                            ))}
                                        </div>
                                        <div className="flex w-full max-w-4xl relative gap-3">
                                            <div className="flex flex-col justify-around w-6 gap-3">
                                                {activeRows.map(row => (
                                                    <div key={row} className="h-full flex items-center justify-center text-xs font-bold text-text-secondary dark:text-gray-500 uppercase">{row}</div>
                                                ))}
                                            </div>
                                            <div
                                                className="flex-1 grid gap-3 h-[500px]"
                                                style={{
                                                    gridTemplateColumns: `repeat(${activeCols.length}, minmax(0, 1fr))`,
                                                    gridTemplateRows: `repeat(${activeRows.length}, minmax(0, 1fr))`
                                                }}
                                            >
                                                {activeRows.map(row => (
                                                    activeCols.map(col => {
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
                            ) : (
                                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                                    <div className="overflow-y-auto p-0 custom-scrollbar">
                                        {selectedLocationItems.length === 0 ? (
                                            <div className="text-center py-12 text-text-secondary">Nenhum item neste local.</div>
                                        ) : (
                                            selectedLocationItems.map(item => {
                                                if (isMobile && onActions) {
                                                    return (
                                                        <InventoryMobileChildRow
                                                            key={item.id}
                                                            item={item}
                                                            style={{}}
                                                            isSelected={selectedItem?.id === item.id}
                                                            isAdmin={hasRole('ADMIN')}
                                                            onSelect={(_id) => setSelectedItem(item)}
                                                            onActions={onActions}
                                                            copyToClipboard={copyToClipboard}
                                                            isLast={false}
                                                        />
                                                    );
                                                }

                                                // Fallback para Desktop List View ou se onActions não for passado
                                                const pos = reverseGridMap[item.id] || 'S/P';
                                                const status = getItemStatus(item);
                                                
                                                return (
                                                    <div 
                                                        key={item.id}
                                                        onClick={() => setSelectedItem(item)}
                                                        className={`
                                                            flex items-center justify-between p-3 border-b border-border-light dark:border-slate-700 cursor-pointer transition-colors
                                                            ${selectedItem?.id === item.id 
                                                                ? 'bg-primary/5 border-primary ring-1 ring-primary/20' 
                                                                : 'bg-background-light dark:bg-slate-800 hover:border-primary/50'}
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <span className="font-mono text-xs font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded border border-border-light dark:border-slate-700 min-w-[32px] text-center">
                                                                {pos}
                                                            </span>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-bold text-sm text-text-main dark:text-white truncate">{item.name}</span>
                                                                <span className="text-xs text-text-secondary truncate">Lote: {item.lotNumber}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {auditMode && (
                                                                status.isExpired 
                                                                    ? <Badge variant="danger" className="text-[10px]">Vencido</Badge>
                                                                    : status.isLowStock 
                                                                        ? <Badge variant="warning" className="text-[10px]">Baixo</Badge>
                                                                        : null
                                                            )}
                                                            <div className="text-right">
                                                                <span className="font-bold text-text-main dark:text-white block">{item.quantity}</span>
                                                                <span className="text-[10px] text-text-secondary">{item.baseUnit}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {viewMode === 'GRID' && (
                                <div className="flex gap-4 text-[10px] text-text-secondary justify-center flex-wrap">
                                    <div className="flex items-center gap-1"><div className="size-3 bg-white border-l-4 border-l-primary border border-slate-200"></div> Ocupado</div>
                                    <div className="flex items-center gap-1"><div className="size-3 bg-slate-50 border border-dashed border-slate-300"></div> Livre</div>
                                </div>
                            )}
                        </div>

                        {/* Painel Lateral de Detalhes (Desktop Only mostly, or bottom sheet) */}
                        <aside className={`
                            w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 h-full overflow-hidden transition-all duration-300
                            ${!selectedItem && isMobile ? 'hidden' : ''}
                        `}>
                            <Card padding="p-0" className="flex flex-col h-full overflow-hidden bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark">
                                {selectedItem ? (
                                    <div className="flex flex-col h-full">
                                        <div className="p-5 border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-slate-800/50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-primary/10">
                                                    {reverseGridMap[selectedItem.id] || 'S/P'}
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 md:hidden" onClick={() => setSelectedItem(null)} icon="close" />
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
                                            {/* Actions for Desktop/Tablet where swipe isn't primary */}
                                            {!isMobile && onActions && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Button
                                                            variant="success"
                                                            onClick={() => {
                                                                // Hack: Use move with type override if supported or just open generic move modal
                                                                // Ideally onActions should support explicit entry/exit
                                                                onActions.move(selectedItem);
                                                            }}
                                                            icon="add_circle"
                                                        >
                                                            Entrada
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            onClick={() => onActions.move(selectedItem)}
                                                            icon="remove_circle"
                                                        >
                                                            Saída
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Button variant="white" onClick={() => onActions.move(selectedItem)} icon="swap_horiz">Mover</Button>
                                                        <Button variant="white" onClick={() => onActions.edit(selectedItem)} icon="edit">Editar</Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary dark:text-gray-500 p-6">
                                        <span className="material-symbols-outlined text-5xl opacity-20 mb-2">touch_app</span>
                                        <p className="text-sm opacity-70">Selecione um item para ver detalhes.</p>
                                    </div>
                                )}
                            </Card>
                        </aside>
                    </div>
                )}
            </div>
        </PageContainer>
    );
};
