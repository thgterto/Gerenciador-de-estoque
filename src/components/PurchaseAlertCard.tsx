
import React, { useMemo } from 'react';
import { InventoryItem } from '../types';
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import { PlusCircle } from 'lucide-react';

interface Props {
    item: InventoryItem;
    onAdd: (item: InventoryItem) => void;
    reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL';
}

export const PurchaseAlertCard: React.FC<Props> = React.memo(({ item, onAdd, reason }) => {
    
    const config = useMemo(() => {
        if (item.quantity === 0) {
            return {
                borderColor: 'border-orbital-subtext/30',
                badge: 'DEPLETED',
                badgeVariant: 'neutral' as const
            };
        }
        
        if (reason === 'EXPIRING') {
            const days = item.expiryDate 
                ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
                : 0;
            return {
                borderColor: 'border-orbital-warning/50',
                badge: `EXP: ${days} DAYS`,
                badgeVariant: 'warning' as const
            };
        }

        // Critical / Low Stock
        return {
            borderColor: 'border-orbital-danger/50',
            badge: 'CRITICAL',
            badgeVariant: 'danger' as const
        };
    }, [item.quantity, item.expiryDate, reason]);

    return (
        <OrbitalCard
            title={item.name}
            action={
                <OrbitalButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onAdd(item)}
                    className="text-orbital-accent hover:bg-orbital-accent/10"
                >
                    <PlusCircle size={16} /> ADD
                </OrbitalButton>
            }
            className={config.borderColor}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-orbital-subtext font-mono">SAP: {item.sapCode || 'N/A'}</span>
                <OrbitalBadge label={config.badge} variant={config.badgeVariant} />
            </div>

            <div className="mt-2">
                <p className="text-xs text-orbital-subtext font-mono uppercase mb-1">Current Stock</p>
                <p className="text-2xl font-bold text-orbital-text font-mono tracking-tight">
                    {item.quantity}<span className="text-sm font-normal text-orbital-subtext ml-0.5">{item.baseUnit}</span>
                </p>
            </div>
        </OrbitalCard>
    );
});
