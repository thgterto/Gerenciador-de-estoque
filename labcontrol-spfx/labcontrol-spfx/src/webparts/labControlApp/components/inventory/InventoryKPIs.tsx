import React from 'react';
import { Package, AlertTriangle, XCircle } from 'lucide-react';
import { OrbitalCard } from '../ui/orbital/OrbitalCard';

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             <MetricCard
                title="Itens Ativos"
                icon={<Package className="text-orbital-accent" size={32} />}
                value={stats.totalItems}
                subValue="Lotes totais"
                color="text-orbital-accent"
             />
             <MetricCard
                title="Baixo Estoque"
                icon={<AlertTriangle className="text-orbital-warning" size={32} />}
                value={stats.lowStockCount}
                subValue="Requer atenção"
                color="text-orbital-warning"
             />
             <MetricCard
                title="Vencidos"
                icon={<XCircle className="text-orbital-danger" size={32} />}
                value={stats.expiredCount}
                subValue="Descartar"
                color="text-orbital-danger"
             />
        </div>
    );
};

const MetricCard = ({ title, icon, value, subValue, color }: any) => (
    <OrbitalCard className="h-full group hover:bg-orbital-surface/80 transition-colors">
        <div className="flex items-center justify-between">
            <div>
                <div className="text-xs font-display font-bold uppercase tracking-widest text-orbital-subtext mb-1">
                    {title}
                </div>
                <div className={`text-4xl font-mono font-bold ${color} drop-shadow-lg`}>
                    {value}
                </div>
                <div className="text-xs text-orbital-subtext mt-1 opacity-70">
                    {subValue}
                </div>
            </div>
            <div className="p-3 bg-orbital-bg rounded-lg border border-orbital-border group-hover:border-orbital-accent/50 transition-colors shadow-inner">
                {icon}
            </div>
        </div>
    </OrbitalCard>
);
