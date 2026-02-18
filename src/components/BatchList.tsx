
import React, { useState, useEffect } from 'react';
import { InventoryService } from '../services/InventoryService';
import { BatchDetailView } from '../types';
import { formatDate } from '../utils/formatters';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { db } from '../db';

interface BatchListProps {
    itemId: string;
    onViewHistory?: (batchId: string) => void;
}

export const BatchList: React.FC<BatchListProps> = ({ itemId, onViewHistory }) => {
    const [batches, setBatches] = useState<BatchDetailView[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                const data = await InventoryService.getItemBatchDetails(itemId);
                if (isMounted) {
                    setBatches(data);
                }
            } catch (e) {
                console.error("Failed to load batch details", e);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (itemId) {
            setLoading(true);
            load();

            const unsubscribe = db.subscribe(() => {
                load();
            });
            return () => {
                isMounted = false;
                unsubscribe();
            };
        }
    }, [itemId]);

    if (loading) {
        return <div className="text-sm text-orbital-subtext animate-pulse p-4 font-mono">Loading batches...</div>;
    }

    if (batches.length === 0) {
        return (
            <div className="text-sm text-orbital-subtext bg-orbital-bg p-4 border border-dashed border-orbital-border text-center font-mono">
                NO BATCH DATA FOUND.
                <br/>
                <span className="text-xs opacity-70">New batches will appear here automatically.</span>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden border border-orbital-border bg-orbital-surface">
            <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-orbital-bg border-b border-orbital-border text-xs font-display font-bold uppercase tracking-wider text-orbital-subtext">
                    <tr>
                        <th className="px-4 py-3 font-medium">Batch</th>
                        <th className="px-4 py-3 font-medium">Expiry</th>
                        <th className="px-4 py-3 font-medium">Location</th>
                        <th className="px-4 py-3 font-medium text-right">Balance</th>
                        <th className="px-4 py-3 font-medium text-center">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-orbital-border/50">
                    {batches.map((batch) => {
                        const daysToExpiry = batch.expiryDate 
                            ? Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            : 999;
                        
                        const isExpired = daysToExpiry < 0;
                        const isNearExpiry = daysToExpiry > 0 && daysToExpiry < 30;

                        return (
                            <tr key={batch.batchId} className="group hover:bg-orbital-accent/5 transition-colors">
                                <td className="px-4 py-3 font-mono font-medium text-orbital-text">
                                    {batch.lotNumber}
                                </td>
                                <td className="px-4 py-3 font-mono text-orbital-subtext">
                                    <div className="flex flex-col">
                                        <span className={isExpired ? 'text-orbital-danger font-bold' : isNearExpiry ? 'text-orbital-warning font-bold' : ''}>
                                            {formatDate(batch.expiryDate)}
                                        </span>
                                        {isNearExpiry && <span className="text-[10px] text-orbital-warning uppercase tracking-wider">Expiring soon</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-orbital-subtext font-mono">
                                    <span className="flex items-center gap-1">
                                        {batch.locationName}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-orbital-text font-mono">
                                    {batch.quantity}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {batch.status === 'BLOCKED' ? (
                                        <OrbitalBadge variant="danger" label="BLOCKED" />
                                    ) : isExpired ? (
                                        <OrbitalBadge variant="danger" label="EXPIRED" />
                                    ) : (
                                        <OrbitalBadge variant="success" label="ACTIVE" />
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {onViewHistory && (
                                        <OrbitalButton
                                            variant="secondary"
                                            size="sm" 
                                            onClick={() => onViewHistory(batch.batchId)}
                                            title="View Batch History"
                                            className="text-[10px] h-6 px-2"
                                        >
                                            TRACE
                                        </OrbitalButton>
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
