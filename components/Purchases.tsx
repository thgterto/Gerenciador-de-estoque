
import React, { useState, useMemo } from 'react';
import { InventoryItem, PurchaseRequestItem } from '../types';
import { normalizeStr } from '../utils/stringUtils';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { EmptyState } from './ui/EmptyState';
import { Tooltip } from './Tooltip';
import { PurchaseAlertCard } from './PurchaseAlertCard';

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

    const existingPurchaseIds = useMemo(() => new Set(purchaseList.map(p => p.itemId)), [purchaseList]);

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const term = normalizeStr(searchQuery);
        return items.filter(i => {
            if (existingPurchaseIds.has(i.id)) return false;
            return normalizeStr(i.name).includes(term) || normalizeStr(i.sapCode).includes(term);
        }).slice(0, 5); 
    }, [items, searchQuery, existingPurchaseIds]);

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border-light dark:border-border-dark mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main dark:text-white">Planejamento de Compras</h1>
                    <p className="text-text-secondary dark:text-slate-400 text-base">Gerencie necessidades de reposição e gere pedidos de compra.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="white" icon="save">
                        Salvar Rascunho
                    </Button>
                    <Button 
                        onClick={onSubmit}
                        disabled={purchaseList.length === 0}
                        variant="primary"
                        icon="ios_share"
                        className="shadow-md shadow-primary/20"
                    >
                        Exportar Pedido
                    </Button>
                </div>
            </div>

            {criticalItems.length > 0 && (
                <section className="shrink-0 mb-8 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary">warning</span>
                        <h2 className="text-xl font-bold text-text-main dark:text-white">Alertas Críticos</h2>
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
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary">list_alt</span>
                        <h2 className="text-xl font-bold text-text-main dark:text-white">Lista de Pedidos</h2>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                         <div className="relative flex-1 sm:w-64 z-20">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input 
                                placeholder="Buscar item ou código SAP..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-sm placeholder:text-text-secondary focus:ring-primary focus:border-primary transition-colors text-text-main dark:text-white outline-none"
                            />
                             {searchQuery && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {searchResults.map(res => (
                                        <button 
                                            key={res.id}
                                            className="w-full text-left px-4 py-3 hover:bg-background-light dark:hover:bg-slate-700/50 border-b border-border-light dark:border-border-dark last:border-none flex justify-between items-center group transition-colors"
                                            onClick={() => {
                                                onAdd(res);
                                                setSearchQuery('');
                                            }}
                                        >
                                            <div className="flex-1 min-w-0 mr-3">
                                                <div className="font-semibold text-text-main dark:text-white text-sm truncate">{res.name}</div>
                                                <div className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                                                    SAP: <span className="font-mono">{res.sapCode}</span> • Estoque: {res.quantity} {res.baseUnit}
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-text-light group-hover:text-primary transition-colors">add_circle</span>
                                        </button>
                                    ))}
                                </div>
                             )}
                        </div>
                        <input className="w-20 py-2 px-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-sm text-center focus:ring-primary focus:border-primary text-text-main dark:text-white outline-none" placeholder="Qtd" type="number" defaultValue="1"/>
                        <button className="flex items-center justify-center size-9 shrink-0 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors" title="Adicionar item">
                            <span className="material-symbols-outlined">add</span>
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm flex-1 flex flex-col">
                    {purchaseList.length > 0 ? (
                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-left text-sm text-text-secondary dark:text-slate-400">
                                <thead className="bg-background-light dark:bg-background-dark text-xs uppercase font-semibold text-text-secondary dark:text-slate-400 border-b border-border-light dark:border-border-dark">
                                    <tr>
                                        <th className="px-6 py-4 w-12">
                                            <input type="checkbox" className="rounded border-border-light text-primary focus:ring-primary dark:bg-surface-dark dark:border-border-dark cursor-pointer"/>
                                        </th>
                                        <th className="px-6 py-4">Item Details</th>
                                        <th className="px-6 py-4">SAP Code</th>
                                        <th className="px-6 py-4 text-center">Estoque</th>
                                        <th className="px-6 py-4 w-32">Qtd. Compra</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {purchaseList.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-background-light dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <input type="checkbox" checked className="rounded border-border-light text-primary focus:ring-primary dark:bg-surface-dark dark:border-border-dark cursor-pointer"/>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-text-main dark:text-white text-sm" title={item.name}>{item.name}</span>
                                                    <span className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">Unidade: {item.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-text-secondary dark:text-slate-400">{item.sapCode || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${item.currentStock <= 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-background-light text-text-main dark:bg-slate-800 dark:text-slate-300 border border-border-light dark:border-border-dark'}`}>
                                                    {item.currentStock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden h-8 w-24">
                                                    <button 
                                                        onClick={() => onUpdateQuantity(item.id, item.requestedQty - 1)}
                                                        className="w-8 h-full flex items-center justify-center text-text-secondary hover:bg-background-light dark:hover:bg-slate-700 hover:text-primary transition-colors active:bg-slate-200"
                                                    >
                                                        -
                                                    </button>
                                                    <input 
                                                        className="w-full h-full border-x border-border-light dark:border-border-dark p-0 text-center text-sm font-bold bg-transparent text-text-main dark:text-white focus:ring-0" 
                                                        type="number" 
                                                        value={item.requestedQty}
                                                        onChange={(e) => onUpdateQuantity(item.id, Number(e.target.value))}
                                                    />
                                                    <button 
                                                        onClick={() => onUpdateQuantity(item.id, item.requestedQty + 1)}
                                                        className="w-8 h-full flex items-center justify-center text-text-secondary hover:bg-background-light dark:hover:bg-slate-700 hover:text-primary transition-colors active:bg-slate-200"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => onRemove(item.id)}
                                                    className="text-text-secondary hover:text-primary transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState 
                            title="Lista de compras vazia" 
                            description="Adicione itens manualmente ou através dos alertas de estoque baixo."
                            icon="shopping_basket"
                        />
                    )}
                    
                    {purchaseList.length > 0 && (
                        <div className="bg-surface-light dark:bg-surface-dark px-6 py-4 border-t border-border-light dark:border-border-dark flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 mt-auto">
                            <div className="text-sm text-text-secondary dark:text-slate-400">
                                Mostrando <span className="font-bold text-text-main dark:text-white">{purchaseList.length}</span> itens selecionados
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="text-right">
                                    <span className="block text-xs text-text-secondary dark:text-slate-400 uppercase font-bold tracking-wider">Quantidade Total</span>
                                    <span className="block text-xl font-bold text-text-main dark:text-white leading-tight">
                                        {totalQuantity} <span className="text-sm font-medium text-text-secondary font-normal">unidades</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </PageContainer>
    );
};
