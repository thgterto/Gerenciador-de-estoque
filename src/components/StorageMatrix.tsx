import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { InventoryItem } from '../types';
import { getItemStatus, analyzeLocation } from '../utils/businessRules';
import { normalizeStr } from '../utils/stringUtils';
import { InventoryService } from '../services/InventoryService';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import { InventoryMobileChildRow } from './InventoryRows';
import {
    Grid as GridIcon,
    List as ListIcon,
    Eye,
    EyeOff,
    Warehouse,
    TableProperties,
    Plus,
    X,
    MoveLeft,
    Edit
} from 'lucide-react';

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
    
    let cellClass = "bg-orbital-bg/30 border-orbital-border border-dashed text-orbital-subtext/50";
    let textClass = "text-orbital-subtext";
    
    if (item) {
        const status = getItemStatus(item);
        // Item Presente (Normal)
        cellClass = "bg-orbital-surface border-orbital-border border-solid shadow-sm hover:border-orbital-accent/50 cursor-grab active:cursor-grabbing";
        textClass = "text-orbital-text";

        if (auditMode) {
            if (status.isExpired) {
                cellClass = "bg-orbital-danger/20 border-orbital-danger/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
                textClass = "text-orbital-danger";
            } else if (status.isLowStock) {
                cellClass = "bg-orbital-warning/20 border-orbital-warning/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
                textClass = "text-orbital-warning";
            } else {
                cellClass = "bg-orbital-success/20 border-orbital-success/50";
                textClass = "text-orbital-success";
            }
        } else {
            cellClass = "bg-orbital-surface border-l-4 border-l-orbital-accent border-y border-r border-orbital-border";
        }
    }

    if (isSelected) {
        cellClass = "bg-orbital-accent text-orbital-bg border-orbital-accent shadow-glow-lg transform scale-105 z-10 font-bold";
        textClass = "text-orbital-bg";
    }

    if (isDragOver && !item) {
        cellClass = "bg-orbital-accent/10 border-orbital-accent border-dashed scale-105 transition-transform z-20 shadow-glow";
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

    return (
        <div 
            onClick={() => onSelect(item || null)}
            draggable={!!item}
            onDragStart={(e) => item && onDragStart(e, item)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                rounded border p-2 flex flex-col justify-between transition-all duration-200 relative overflow-hidden group min-h-[70px]
                ${cellClass}
            `}
        >
            <div className="flex justify-between items-start pointer-events-none">
                <span className={`text-[10px] font-bold opacity-60 ${isSelected ? 'opacity-80' : ''}`}>{cellId}</span>
                {item && !isSelected && !auditMode && (
                    <div className="w-1.5 h-1.5 rounded-full bg-orbital-accent/50"></div>
                )}
                 {item && auditMode && (
                    <div className={`w-2 h-2 rounded-full ${getItemStatus(item).isExpired ? 'bg-orbital-danger animate-pulse' : 'bg-orbital-success'}`}></div>
                )}
            </div>
            {item ? (
                <>
                    <div className={`text-[10px] font-bold truncate leading-tight mt-1 ${textClass}`} title={item.name}>{item.name}</div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Plus className="text-orbital-accent/50" size={20} />
                </div>
            )}
        </div>
    );
});

export const StorageMatrix: React.FC<Props> = ({ items, onActions }) => {
    const { addToast } = useAlert();
    const { hasRole } = useAuth();
    const [selectedLocKey, setSelectedLocKey] = useState<string | null>(null);
    const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
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

    // Itens do local selecionado (Armazém > Armário)
    const selectedLocationItems = useMemo((): InventoryItem[] => {
        return selectedLocKey ? (locations[selectedLocKey] || []) : [];
    }, [selectedLocKey, locations]);

    // Agrupa prateleiras disponíveis neste local
    const availableShelves = useMemo(() => {
        const shelves = new Set<string>();
        selectedLocationItems.forEach(item => {
            shelves.add(item.location.shelf || 'Sem Prateleira');
        });
        return Array.from(shelves).sort();
    }, [selectedLocationItems]);

    // Estatísticas por prateleira
    const shelfStats = useMemo(() => {
        const stats: Record<string, ReturnType<typeof analyzeLocation>> = {};
        availableShelves.forEach(shelf => {
            const shelfItems = selectedLocationItems.filter(i => (i.location.shelf || 'Sem Prateleira') === shelf);
            stats[shelf] = analyzeLocation(shelfItems);
        });
        return stats;
    }, [availableShelves, selectedLocationItems]);

    // Itens filtrados pela prateleira selecionada (para o Grid/Lista final)
    const finalViewItems = useMemo(() => {
        if (!selectedShelf) return [];
        return selectedLocationItems.filter(item => (item.location.shelf || 'Sem Prateleira') === selectedShelf);
    }, [selectedLocationItems, selectedShelf]);

    // Mapeia itens para o Grid e vice-versa
    const { gridMap, reverseGridMap } = useMemo(() => {
        const map: Record<string, InventoryItem> = {};
        const revMap: Record<string, string> = {};
        const unassigned: InventoryItem[] = [];
        
        finalViewItems.forEach(item => {
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
    }, [finalViewItems]);

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
        <PageContainer scrollable>
             <PageHeader
                title={
                    selectedShelf
                        ? selectedShelf
                        : selectedLocKey
                            ? (selectedLocKey.split(' > ')[1] || selectedLocKey)
                            : "Locais de Armazenamento"
                }
                description={
                    selectedShelf
                        ? `${selectedLocKey} > ${selectedShelf}`
                        : selectedLocKey
                            ? `${selectedLocKey.split(' > ')[0]} > Selecione a Prateleira`
                            : "Selecione um local para gerenciar a disposição física."
                }
             >
                {selectedLocKey && (
                    <div className="flex gap-2">
                        <OrbitalButton variant="ghost" onClick={() => {
                            if (selectedShelf) {
                                setSelectedShelf(null);
                                setSelectedItem(null);
                            } else {
                                setSelectedLocKey(null);
                                setSelectedItem(null);
                            }
                        }}>
                            Voltar
                        </OrbitalButton>

                         <OrbitalButton
                            onClick={() => setViewMode(viewMode === 'GRID' ? 'LIST' : 'GRID')}
                            variant="outline"
                            icon={viewMode === 'GRID' ? <ListIcon size={16} /> : <GridIcon size={16} />}
                            title="Alternar Visualização"
                        >
                            {viewMode === 'GRID' ? 'Lista' : 'Grid'}
                        </OrbitalButton>
                        <OrbitalButton
                            id="tour-audit-btn"
                            onClick={() => setAuditMode(!auditMode)}
                            variant={auditMode ? 'warning' : 'outline'}
                            icon={auditMode ? <Eye size={16} /> : <EyeOff size={16} />}
                            className={`hidden sm:flex ${auditMode ? 'shadow-glow-sm' : ''}`}
                        >
                            {auditMode ? 'Audit ON' : 'Audit'}
                        </OrbitalButton>
                    </div>
                )}
             </PageHeader>
            
            <div className={`flex-1 relative`}>
                {!selectedLocKey ? (
                    <div id="tour-storage-grid">
                        {Object.keys(locations).length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-orbital-subtext opacity-60">
                                <Warehouse size={64} className="mb-4 text-orbital-border" />
                                <p>Nenhum local ativo.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {Object.entries(locations).map(([key]) => {
                                    const analysis = locationStats[key];
                                    const [warehouse, cabinet] = key.split(' > ');
                                    return (
                                        <OrbitalCard
                                            key={key}
                                            onClick={() => setSelectedLocKey(key)}
                                            className="flex flex-col gap-4 transition-all duration-200 cursor-pointer hover:bg-orbital-surface/80"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded bg-orbital-bg border border-orbital-border text-orbital-accent`}>
                                                        <Warehouse size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-orbital-text text-base">{cabinet}</h3>
                                                        <p className="text-xs text-orbital-subtext">{warehouse}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-orbital-subtext mt-0.5">
                                                <span className="font-medium bg-orbital-surface px-2 py-0.5 rounded border border-orbital-border">
                                                    {analysis.count} Itens
                                                </span>
                                            </div>
                                        </OrbitalCard>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : !selectedShelf ? (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {availableShelves.map(shelf => {
                                const analysis = shelfStats[shelf];
                                return (
                                    <OrbitalCard
                                        key={shelf}
                                        onClick={() => setSelectedShelf(shelf)}
                                        className="flex flex-col gap-4 transition-all duration-200 cursor-pointer hover:bg-orbital-surface/80"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded bg-orbital-bg border border-orbital-border text-orbital-accent`}>
                                                    <TableProperties size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-orbital-text text-base">{shelf}</h3>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-orbital-subtext mt-0.5">
                                            <span className="font-medium bg-orbital-surface px-2 py-0.5 rounded border border-orbital-border">
                                                {analysis.count} Itens
                                            </span>
                                        </div>
                                    </OrbitalCard>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-4 min-h-0">
                            {viewMode === 'GRID' ? (
                                <OrbitalCard className="flex-1 flex flex-col justify-center relative min-h-[500px] overflow-auto custom-scrollbar">
                                    <div className="min-w-[600px] flex flex-col items-center mx-auto">
                                        <div className="flex mb-3 ml-8 w-full max-w-4xl gap-3">
                                            {activeCols.map(col => (
                                                <div key={col} className="flex-1 text-center text-xs font-bold text-orbital-subtext uppercase tracking-widest">{col}</div>
                                            ))}
                                        </div>
                                        <div className="flex w-full max-w-4xl relative gap-3">
                                            <div className="flex flex-col justify-around w-6 gap-3">
                                                {activeRows.map(row => (
                                                    <div key={row} className="h-full flex items-center justify-center text-xs font-bold text-orbital-subtext uppercase">{row}</div>
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
                                </OrbitalCard>
                            ) : (
                                <OrbitalCard noPadding className="flex-1 flex flex-col overflow-hidden">
                                    <div className="overflow-visible p-0">
                                        {finalViewItems.length === 0 ? (
                                            <div className="text-center py-12 text-orbital-subtext">Nenhum item nesta prateleira.</div>
                                        ) : (
                                            finalViewItems.map(item => {
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
                                                            flex items-center justify-between p-3 border-b border-orbital-border cursor-pointer transition-colors
                                                            ${selectedItem?.id === item.id 
                                                                ? 'bg-orbital-accent/10 border-orbital-accent'
                                                                : 'bg-orbital-bg hover:bg-orbital-surface'}
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <span className="font-mono text-xs font-bold bg-orbital-surface px-2 py-1 rounded border border-orbital-border min-w-[32px] text-center text-orbital-text">
                                                                {pos}
                                                            </span>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-bold text-sm text-orbital-text truncate">{item.name}</span>
                                                                <span className="text-xs text-orbital-subtext truncate">Lote: {item.lotNumber}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {auditMode && (
                                                                status.isExpired 
                                                                    ? <OrbitalBadge variant="danger" label="Vencido" />
                                                                    : status.isLowStock 
                                                                        ? <OrbitalBadge variant="warning" label="Baixo" />
                                                                        : null
                                                            )}
                                                            <div className="text-right">
                                                                <span className="font-bold text-orbital-text block">{item.quantity}</span>
                                                                <span className="text-[10px] text-orbital-subtext">{item.baseUnit}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </OrbitalCard>
                            )}
                            
                            {viewMode === 'GRID' && (
                                <div className="flex gap-4 text-[10px] text-orbital-subtext justify-center flex-wrap">
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orbital-surface border-l-4 border-l-orbital-accent border border-orbital-border"></div> Ocupado</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orbital-bg/30 border border-dashed border-orbital-border"></div> Livre</div>
                                </div>
                            )}
                        </div>

                        {/* Painel Lateral de Detalhes (Desktop Sidebar / Mobile Bottom Sheet) */}
                        <div className={`
                            ${selectedItem && !isMobile ? '' : 'hidden'} lg:block
                            w-full lg:w-80 flex-shrink-0 flex flex-col gap-4
                            lg:sticky lg:top-4 lg:self-start transition-all duration-300
                        `}>
                            <OrbitalCard noPadding className="flex flex-col bg-orbital-surface border-orbital-border h-full">
                                {selectedItem ? (
                                    <div className="flex flex-col h-full">
                                        <div className="p-5 border-b border-orbital-border bg-orbital-bg/50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="bg-orbital-accent/10 text-orbital-accent text-xs font-bold px-2.5 py-1 rounded-none uppercase tracking-wider border border-orbital-accent/20">
                                                    {reverseGridMap[selectedItem.id] || 'S/P'}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-orbital-text text-lg leading-tight break-words" title={selectedItem.name}>{selectedItem.name}</h3>
                                            <p className="text-xs text-orbital-subtext font-mono mt-1">{selectedItem.sapCode || 'Sem código'}</p>
                                        </div>
                                        
                                        <div className="p-5 space-y-5">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-orbital-bg p-3 rounded border border-orbital-border">
                                                    <p className="text-[10px] text-orbital-subtext uppercase font-bold tracking-wider mb-1">Qtd</p>
                                                    <p className="font-bold text-lg text-orbital-text leading-none">{selectedItem.quantity} <span className="text-sm font-normal text-orbital-subtext">{selectedItem.baseUnit}</span></p>
                                                </div>
                                                <div className="bg-orbital-bg p-3 rounded border border-orbital-border">
                                                    <p className="text-[10px] text-orbital-subtext uppercase font-bold tracking-wider mb-1">Lote</p>
                                                    <p className="font-bold text-sm text-orbital-text truncate" title={selectedItem.lotNumber}>{selectedItem.lotNumber}</p>
                                                </div>
                                            </div>
                                            {/* Actions for Desktop/Tablet */}
                                            {!isMobile && onActions && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <OrbitalButton
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => onActions.move(selectedItem)}
                                                            icon={<Plus size={14} />}
                                                        >
                                                            Entrada
                                                        </OrbitalButton>
                                                        <OrbitalButton
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => onActions.move(selectedItem)}
                                                            icon={<X size={14} />}
                                                        >
                                                            Saída
                                                        </OrbitalButton>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <OrbitalButton variant="outline" size="sm" onClick={() => onActions.move(selectedItem)} icon={<MoveLeft size={14} />}>Mover</OrbitalButton>
                                                        <OrbitalButton variant="outline" size="sm" onClick={() => onActions.edit(selectedItem)} icon={<Edit size={14} />}>Editar</OrbitalButton>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center text-orbital-subtext p-6 opacity-60">
                                        <GridIcon size={48} className="mb-2 opacity-50" />
                                        <p className="text-sm">Selecione um item para ver detalhes.</p>
                                    </div>
                                )}
                            </OrbitalCard>
                        </div>

                        {/* Mobile Bottom Bar (Sheet) */}
                        {selectedItem && (
                            <div className={`
                                lg:hidden fixed bottom-0 left-0 right-0 z-50
                                bg-orbital-surface border-t border-orbital-border
                                shadow-glow-lg
                                animate-in slide-in-from-bottom duration-200
                                pb-safe
                            `}>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="bg-orbital-accent/10 text-orbital-accent text-[10px] font-bold px-2 py-0.5 rounded-none uppercase tracking-wider border border-orbital-accent/20">
                                                    {reverseGridMap[selectedItem.id] || 'S/P'}
                                                </div>
                                                <p className="text-[10px] text-orbital-subtext font-mono">{selectedItem.sapCode || 'Sem código'}</p>
                                            </div>
                                            <h3 className="font-bold text-orbital-text text-base leading-tight truncate max-w-[280px]" title={selectedItem.name}>{selectedItem.name}</h3>
                                        </div>
                                        <button className="text-orbital-subtext hover:text-orbital-text" aria-label="Fechar detalhes" onClick={() => setSelectedItem(null)}>
                                            <X size={20} aria-hidden="true" />
                                        </button>
                                    </div>

                                    <div className="flex gap-3 mb-4">
                                        <div className="flex-1 bg-orbital-bg p-2 rounded border border-orbital-border flex flex-col justify-center">
                                            <p className="text-[10px] text-orbital-subtext uppercase font-bold tracking-wider mb-0.5">Qtd</p>
                                            <p className="font-bold text-base text-orbital-text leading-none">{selectedItem.quantity} <span className="text-[10px] font-normal text-orbital-subtext">{selectedItem.baseUnit}</span></p>
                                        </div>
                                        <div className="flex-1 bg-orbital-bg p-2 rounded border border-orbital-border flex flex-col justify-center">
                                            <p className="text-[10px] text-orbital-subtext uppercase font-bold tracking-wider mb-0.5">Lote</p>
                                            <p className="font-bold text-sm text-orbital-text truncate leading-tight" title={selectedItem.lotNumber}>{selectedItem.lotNumber}</p>
                                        </div>
                                    </div>

                                    {onActions && (
                                        <div className="grid grid-cols-4 gap-2">
                                            <OrbitalButton size="sm" variant="primary" onClick={() => onActions.move(selectedItem)} icon={<Plus size={16} />} className="col-span-1" />
                                            <OrbitalButton size="sm" variant="danger" onClick={() => onActions.move(selectedItem)} icon={<X size={16} />} className="col-span-1" />
                                            <OrbitalButton size="sm" variant="outline" onClick={() => onActions.move(selectedItem)} icon={<MoveLeft size={16} />} className="col-span-1" />
                                            <OrbitalButton size="sm" variant="outline" onClick={() => onActions.edit(selectedItem)} icon={<Edit size={16} />} className="col-span-1" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Spacer to prevent content being hidden behind bottom bar on mobile */}
                        {selectedItem && <div className="lg:hidden h-[240px]" />}
                    </div>
                )}
            </div>
        </PageContainer>
    );
};
