import React from 'react';
import { MetricCard } from '../ui/MetricCard';

interface InventoryStats {
    totalItems: number;
    lowStockCount: number;
    expiredCount: number;
}

interface InventoryKPIsProps {
    stats: InventoryStats;
}

export const InventoryKPIs: React.FC<InventoryKPIsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 mb-6">
             <MetricCard
                title="Itens Ativos"
                icon="inventory_2"
                value={stats.totalItems}
                subValue="Lotes totais"
                variant="primary"
                className="h-24 sm:h-28"
             />
             <MetricCard
                title="Baixo Estoque"
                icon="warning"
                value={stats.lowStockCount}
                subValue="Requer atenção"
                variant="warning"
                className="h-24 sm:h-28"
             />
             <MetricCard
                title="Vencidos"
                icon="event_busy"
                value={stats.expiredCount}
                subValue="Descartar"
                variant="danger"
                className="h-24 sm:h-28"
             />
        </div>
    );
};
