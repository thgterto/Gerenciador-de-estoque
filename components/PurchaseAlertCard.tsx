
import React, { useMemo } from 'react';
import { InventoryItem } from '../types';
import { Card, ColorScheme } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
    item: InventoryItem;
    onAdd: (item: InventoryItem) => void;
    reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL';
}

export const PurchaseAlertCard: React.FC<Props> = React.memo(({ item, onAdd, reason }) => {
    
    const config = useMemo(() => {
        if (item.quantity === 0) {
            return {
                scheme: 'neutral' as ColorScheme,
                badge: 'Esgotado',
                badgeColor: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            };
        }
        
        if (reason === 'EXPIRING') {
            const days = item.expiryDate 
                ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
                : 0;
            return {
                scheme: 'warning' as ColorScheme,
                badge: `Vence: ${days} dias`,
                badgeColor: undefined // Uses default warning scheme colors from Card
            };
        }

        // Critical / Low Stock
        return {
            scheme: 'danger' as ColorScheme,
            badge: 'Crítico',
            badgeColor: undefined // Uses default danger scheme colors from Card
        };
    }, [item.quantity, item.expiryDate, reason]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAdd(item);
        }
    };

    return (
        <div role="button" tabIndex={0} onKeyDown={handleKeyDown}>
            <Card
                variant="item"
                colorScheme={config.scheme}
                title={item.name}
                subtitle={`SAP: ${item.sapCode || 'N/A'}`}
                badge={{
                    label: config.badge,
                    color: config.badgeColor
                }}
                action={
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onAdd(item); }}
                        className="text-primary font-bold hover:bg-primary/10"
                        icon="add_circle"
                    >
                        Adicionar
                    </Button>
                }
            >
                <div>
                    <p className="text-sm text-text-secondary dark:text-gray-400">Estoque Atual</p>
                    <p className="text-2xl font-bold text-text-main dark:text-white tracking-tight">
                        {item.quantity}<span className="text-sm font-normal text-text-secondary ml-0.5">{item.baseUnit}</span>
                    </p>
                </div>
            </Card>
        </div>
    );
});
