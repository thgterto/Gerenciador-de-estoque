import React, { useState, useMemo } from 'react';
import { InventoryItem, PurchaseRequestItem } from '../types';
import { normalizeStr } from '../utils/stringUtils';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { PurchaseAlertCard } from './PurchaseAlertCard';
import { useDebounce } from '../hooks/useDebounce';
import { EmptyState } from './ui/EmptyState';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import { OrbitalTable, OrbitalHead, OrbitalBody, OrbitalRow, OrbitalTh, OrbitalTd } from './ui/orbital/OrbitalTable';
import {
    Save,
    Share,
    AlertTriangle,
    List,
    Search,
    PlusCircle,
    Plus,
    Minus,
    Trash2,
    ShoppingCart
} from 'lucide-react';

interface PurchasesProps {
  items: InventoryItem[];
  purchaseList: PurchaseRequestItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onSubmit: () => void;
  onAdd: (item: InventoryItem) => void;
}

export const Purchases: React.FC<PurchasesProps> = ({ 
    items, 
    purchaseList, 
    onRemove, 
    onUpdateQuantity, 
    onSubmit,
    onAdd
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const existingPurchaseIds = useMemo(() => new Set(purchaseList.map(p => p.itemId)), [purchaseList]);

    const searchResults = useMemo(() => {
        if (!debouncedSearchQuery) return [];
        const term = normalizeStr(debouncedSearchQuery);
        return items.filter(i => {
            if (existingPurchaseIds.has(i.id)) return false;
            return normalizeStr(i.name).includes(term) || normalizeStr(i.sapCode).includes(term);
        }).slice(0, 5); 
    }, [items, debouncedSearchQuery, existingPurchaseIds]);

    const criticalItems = useMemo(() => {
        const now = new Date().getTime();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        const lowStock = items.filter(i => 
            !existingPurchaseIds.has(i.id) && 
            i.quantity <= i.minStockLevel && 
            i.minStockLevel > 0
        );

        const expiring = items.filter(i => {
            if (!i.expiryDate || existingPurchaseIds.has(i.id)) return false;
            const expTime = new Date(i.expiryDate).getTime();
            const diff = expTime - now;
            return diff >= 0 && diff <= thirtyDaysInMs;
        });
        
        return [
            ...lowStock.map(i => ({ ...i, reason: 'LOW_STOCK' as const })),
            ...expiring.map(i => ({ ...i, reason: 'EXPIRING' as const }))
        ].slice(0, 6);
    }, [items, existingPurchaseIds]);

    const totalQuantity = purchaseList.reduce((acc, curr) => acc + curr.requestedQty, 0);

    return (
        <PageContainer scrollable={true}>
            <PageHeader 
                title="Planejamento de Compras" 
                description="Gerencie necessidades de reposição e gere pedidos de compra."
            >
                <div className="flex gap-2">
                    <OrbitalButton variant="outline" icon={<Save size={16} />}>
                        Salvar Rascunho
                    </OrbitalButton>
                    <OrbitalButton
                        onClick={onSubmit}
                        disabled={purchaseList.length === 0}
                        variant="primary"
                        icon={<Share size={16} />}
                    >
                        Exportar Pedido
                    </OrbitalButton>
                </div>
            </PageHeader>

            {criticalItems.length > 0 && (
                <section className="shrink-0 mb-8 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4 text-orbital-warning">
                        <AlertTriangle size={24} />
                        <h2 className="text-xl font-bold font-display uppercase">Alertas Críticos</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {criticalItems.map(item => (
                            <PurchaseAlertCard 
                                key={item.id}
                                item={item}
                                reason={item.reason}
                                onAdd={onAdd}
                            />
                        ))}
                    </div>
                </section>
            )}

            <section className="flex flex-col gap-4 flex-1 min-h-[400px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                    <div className="flex items-center gap-2 text-orbital-text">
                        <List size={24} />
                        <h2 className="text-xl font-bold font-display uppercase">Lista de Pedidos</h2>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto relative">
                         <div className="relative flex-1 sm:w-72 z-20">
                            <OrbitalInput
                                placeholder="Buscar item ou código SAP..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                startAdornment={<Search size={16} />}
                            />
                             {searchQuery && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-orbital-surface border border-orbital-border rounded shadow-glow-lg z-50 max-h-60 overflow-y-auto">
                                    {searchResults.map(res => (
                                        <button 
                                            key={res.id}
                                            className="w-full text-left px-4 py-3 hover:bg-orbital-bg border-b border-orbital-border last:border-none flex justify-between items-center group transition-colors"
                                            onClick={() => {
                                                onAdd(res);
                                                setSearchQuery('');
                                            }}
                                        >
                                            <div className="flex-1 min-w-0 mr-3">
                                                <div className="font-bold text-orbital-text text-sm truncate">{res.name}</div>
                                                <div className="text-xs text-orbital-subtext mt-0.5 font-mono">
                                                    SAP: {res.sapCode} • Estoque: {res.quantity} {res.baseUnit}
                                                </div>
                                            </div>
                                            <PlusCircle className="text-orbital-subtext group-hover:text-orbital-accent transition-colors" size={20} />
                                        </button>
                                    ))}
                                </div>
                             )}
                        </div>
                    </div>
                </div>

                {purchaseList.length > 0 ? (
                    <div className="border border-orbital-border rounded overflow-hidden">
                        <OrbitalTable className="border-0">
                            <OrbitalHead>
                                <OrbitalRow isHoverable={false}>
                                    <OrbitalTh className="w-12"><input type="checkbox" className="accent-orbital-accent" /></OrbitalTh>
                                    <OrbitalTh>Item Details</OrbitalTh>
                                    <OrbitalTh>SAP Code</OrbitalTh>
                                    <OrbitalTh align="center">Estoque</OrbitalTh>
                                    <OrbitalTh className="w-32">Qtd. Compra</OrbitalTh>
                                    <OrbitalTh align="right">Ações</OrbitalTh>
                                </OrbitalRow>
                            </OrbitalHead>
                            <OrbitalBody>
                                {purchaseList.map((item) => (
                                    <OrbitalRow key={item.id}>
                                        <OrbitalTd>
                                            <input type="checkbox" checked className="accent-orbital-accent" />
                                        </OrbitalTd>
                                        <OrbitalTd>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-orbital-text text-sm" title={item.name}>{item.name}</span>
                                                <span className="text-xs text-orbital-subtext mt-0.5">Unidade: {item.unit}</span>
                                            </div>
                                        </OrbitalTd>
                                        <OrbitalTd className="font-mono text-xs text-orbital-subtext">{item.sapCode || '-'}</OrbitalTd>
                                        <OrbitalTd align="center">
                                             <OrbitalBadge
                                                variant={item.currentStock <= 0 ? 'danger' : 'neutral'}
                                                label={item.currentStock.toString()}
                                             />
                                        </OrbitalTd>
                                        <OrbitalTd>
                                            <div className="flex items-center rounded border border-orbital-border bg-orbital-bg overflow-hidden h-8 w-24">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, item.requestedQty - 1)}
                                                    className="w-8 h-full flex items-center justify-center text-orbital-subtext hover:bg-orbital-surface hover:text-orbital-accent transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <input
                                                    className="w-full h-full border-x border-orbital-border p-0 text-center text-sm font-mono font-bold bg-transparent text-orbital-text outline-none"
                                                    type="number"
                                                    value={item.requestedQty}
                                                    onChange={(e) => onUpdateQuantity(item.id, Number(e.target.value))}
                                                />
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, item.requestedQty + 1)}
                                                    className="w-8 h-full flex items-center justify-center text-orbital-subtext hover:bg-orbital-surface hover:text-orbital-accent transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </OrbitalTd>
                                        <OrbitalTd align="right">
                                            <button 
                                                onClick={() => onRemove(item.id)}
                                                className="text-orbital-subtext hover:text-orbital-danger transition-colors p-1"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </OrbitalTd>
                                    </OrbitalRow>
                                ))}
                            </OrbitalBody>
                        </OrbitalTable>
                    </div>
                ) : (
                    <EmptyState 
                        title="Lista de compras vazia" 
                        description="Adicione itens manualmente ou através dos alertas de estoque baixo."
                        icon="cart" // Mapped inside EmptyState if updated, or string passed through
                    />
                )}
                
                {purchaseList.length > 0 && (
                    <div className="bg-orbital-surface px-6 py-4 border border-t-0 border-orbital-border rounded-b-xl flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 mt-auto shadow-sm">
                        <div className="text-sm text-orbital-subtext">
                            Mostrando <span className="font-bold text-orbital-text">{purchaseList.length}</span> itens selecionados
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="text-right">
                                <span className="block text-xs text-orbital-subtext uppercase font-bold tracking-wider">Quantidade Total</span>
                                <span className="block text-xl font-bold text-orbital-text leading-tight">
                                    {totalQuantity} <span className="text-sm font-medium text-orbital-subtext font-normal">unidades</span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </PageContainer>
    );
};
