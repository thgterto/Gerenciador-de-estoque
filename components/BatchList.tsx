
import React, { useState, useEffect } from 'react';
import { InventoryService } from '../services/InventoryService';
import { BatchDetailView } from '../types';
import { formatDate } from '../utils/formatters';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { db } from '../db';

interface BatchListProps {
    itemId: string;
    onViewHistory?: (batchId: string) => void;
}

export const BatchList: React.FC<BatchListProps> = ({ itemId, onViewHistory }) => {
    const [batches, setBatches] = useState<BatchDetailView[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            // Don't set loading on updates to avoid flickering
            try {
                const data = await InventoryService.getItemBatchDetails(itemId);
                setBatches(data);
            } catch (e) {
                console.error("Failed to load batch details", e);
            } finally {
                setLoading(false);
            }
        };

        if (itemId) {
            setLoading(true); // Only set loading on initial mount/id change
            load();

            // Subscribe to DB changes to update batch list in real-time
            const unsubscribe = db.subscribe(() => {
                load();
            });
            return () => unsubscribe();
        }
    }, [itemId]);

    if (loading) {
        return <div className="text-sm text-text-secondary animate-pulse p-4">Carregando detalhes dos lotes...</div>;
    }

    if (batches.length === 0) {
        return (
            <div className="text-sm text-text-secondary bg-background-light dark:bg-slate-800 p-4 rounded-lg border border-dashed border-border-light dark:border-slate-700 text-center">
                Este item ainda não possui detalhamento de lotes (Legado V1).
                <br/>
                <span className="text-xs opacity-70">Novos lotes aparecerão aqui automaticamente.</span>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-border-light dark:border-border-dark">
            <table className="w-full text-left text-xs">
                <thead className="bg-background-light dark:bg-slate-800/50 text-text-secondary dark:text-slate-400 font-semibold border-b border-border-light dark:border-border-dark">
                    <tr>
                        <th className="px-4 py-3">Lote</th>
                        <th className="px-4 py-3">Validade</th>
                        <th className="px-4 py-3">Localização</th>
                        <th className="px-4 py-3 text-right">Saldo</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark bg-surface-light dark:bg-surface-dark">
                    {batches.map((batch) => {
                        const daysToExpiry = batch.expiryDate 
                            ? Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            : 999;
                        
                        const isExpired = daysToExpiry < 0;
                        const isNearExpiry = daysToExpiry > 0 && daysToExpiry < 30;

                        return (
                            <tr key={batch.batchId} className="hover:bg-background-light dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="px-4 py-3 font-mono font-medium text-text-main dark:text-white">
                                    {batch.lotNumber}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className={isExpired ? 'text-danger font-bold' : isNearExpiry ? 'text-warning font-bold' : 'text-text-secondary dark:text-slate-400'}>
                                            {formatDate(batch.expiryDate)}
                                        </span>
                                        {isNearExpiry && <span className="text-[10px] text-warning">Vence em {daysToExpiry} dias</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-text-secondary dark:text-slate-300">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px] opacity-70">location_on</span>
                                        {batch.locationName}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-text-main dark:text-white">
                                    {batch.quantity}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {batch.status === 'BLOCKED' ? (
                                        <Badge variant="danger">Bloqueado</Badge>
                                    ) : isExpired ? (
                                        <Badge variant="danger">Vencido</Badge>
                                    ) : (
                                        <Badge variant="success">Ativo</Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {onViewHistory && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => onViewHistory(batch.batchId)}
                                            title="Ver Histórico Completo do Lote"
                                            icon="history"
                                        >
                                            Rastrear
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
