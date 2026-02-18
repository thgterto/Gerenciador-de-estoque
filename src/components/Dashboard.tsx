import React from 'react';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import Chart from 'react-apexcharts';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, MovementRecord } from '../types';
import { formatDateTime, formatDate } from '../utils/formatters';
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalTable, OrbitalHead, OrbitalBody, OrbitalRow, OrbitalTh, OrbitalTd } from './ui/orbital/OrbitalTable';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import {
    Package,
    DollarSign,
    AlertTriangle,
    AlertCircle,
    History,
    ArrowRight,
    ShoppingCart
} from 'lucide-react';

interface DashboardProps {
  items: InventoryItem[];
  history: MovementRecord[];
  onAddToPurchase: (item: InventoryItem, reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ items, history, onAddToPurchase }) => {
  const {
    totalItems,
    lowStockItems,
    outOfStockItems,
    expiringItems,
    totalValue,
    recentTransactions,
    paretoData
  } = useDashboardAnalytics(items, history);
  
  const navigate = useNavigate();

  // Chart Configuration
  const commonChartOptions: ApexCharts.ApexOptions = {
    chart: {
        toolbar: { show: false },
        background: 'transparent',
        fontFamily: 'inherit'
    },
    colors: ['#06b6d4', '#f4f4f5'],
    grid: {
        borderColor: '#27272a',
        strokeDashArray: 4,
    },
    theme: { mode: 'dark' },
    tooltip: { theme: 'dark' }
  };

  const paretoOptions: ApexCharts.ApexOptions = {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: 'line' },
    stroke: { width: [0, 3], curve: 'smooth' },
    plotOptions: {
      bar: { columnWidth: '60%', borderRadius: 2 }
    },
    dataLabels: { enabled: false },
    xaxis: {
        categories: paretoData.map((d: { category: string }) => d.category),
        labels: { style: { colors: '#a1a1aa' } }
    },
    yaxis: [
      { title: { text: 'Valor Total', style: { color: '#a1a1aa' } }, labels: { style: { colors: '#a1a1aa' } } },
      { opposite: true, title: { text: 'Acumulado %', style: { color: '#a1a1aa' } }, max: 100, labels: { style: { colors: '#a1a1aa' } } }
    ],
    legend: { position: 'top', labels: { colors: '#f4f4f5' } }
  };

  const paretoSeries = [
    { name: 'Valor (R$)', type: 'column', data: paretoData.map((d: { value: number }) => d.value) },
    { name: '% Acumulado', type: 'line', data: paretoData.map((d: { accumulatedPercentage: number }) => d.accumulatedPercentage) }
  ];

  return (
    <PageContainer scrollable>
      <PageHeader
          title="Dashboard"
          description="Visão Geral Operacional"
      />

      <div className="grid grid-cols-1 gap-6 pb-10">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             <MetricCard
                title="Total de Itens"
                value={totalItems}
                icon={<Package size={24} />}
                color="text-orbital-accent"
                onClick={() => navigate('/inventory')}
             />
             <MetricCard
                title="Valor em Estoque"
                value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={<DollarSign size={24} />}
                color="text-orbital-success"
             />
             <MetricCard
                title="Baixo Estoque"
                value={lowStockItems.length}
                subtitle={outOfStockItems.length > 0 ? `${outOfStockItems.length} zerados` : undefined}
                icon={<AlertTriangle size={24} />}
                color="text-orbital-warning"
             />
             <MetricCard
                title="A Vencer"
                value={expiringItems.length}
                icon={<AlertCircle size={24} />}
                color="text-orbital-danger"
             />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
                <OrbitalCard
                    title="Movimentações Recentes"
                    className="h-full"
                    action={
                        <OrbitalButton variant="ghost" size="sm" onClick={() => navigate('/history')} icon={<ArrowRight size={14} />}>
                            Ver Tudo
                        </OrbitalButton>
                    }
                >
                    <div className="overflow-x-auto">
                        <OrbitalTable className="border-0">
                            <OrbitalHead>
                                <OrbitalRow isHoverable={false}>
                                    <OrbitalTh>Tipo</OrbitalTh>
                                    <OrbitalTh>Item</OrbitalTh>
                                    <OrbitalTh align="right">Qtd</OrbitalTh>
                                    <OrbitalTh align="right">Data</OrbitalTh>
                                </OrbitalRow>
                            </OrbitalHead>
                            <OrbitalBody>
                                {recentTransactions.map((tx) => (
                                    <OrbitalRow key={tx.id}>
                                        <OrbitalTd>
                                            <OrbitalBadge
                                                label={tx.type}
                                                variant={tx.type === 'ENTRADA' ? 'success' : tx.type === 'SAIDA' ? 'neutral' : 'warning'}
                                            />
                                        </OrbitalTd>
                                        <OrbitalTd>
                                            <div className="font-bold text-orbital-text">{tx.productName}</div>
                                            <div className="text-xs text-orbital-subtext font-mono">Lote: {tx.lot}</div>
                                        </OrbitalTd>
                                        <OrbitalTd align="right">
                                            <span className="font-bold">{tx.quantity}</span> <span className="text-xs text-orbital-subtext">{tx.unit}</span>
                                        </OrbitalTd>
                                        <OrbitalTd align="right">
                                            <span className="text-xs text-orbital-subtext">{formatDateTime(tx.date)}</span>
                                        </OrbitalTd>
                                    </OrbitalRow>
                                ))}
                                {recentTransactions.length === 0 && (
                                    <OrbitalRow isHoverable={false}>
                                        <td colSpan={4} className="p-4 text-center text-orbital-subtext">Nenhuma movimentação recente.</td>
                                    </OrbitalRow>
                                )}
                            </OrbitalBody>
                        </OrbitalTable>
                    </div>
                </OrbitalCard>
            </div>

            {/* Action Required & Charts */}
            <div className="flex flex-col gap-6">
                
                {/* Action Items */}
                <OrbitalCard
                    title="Ação Necessária"
                    className="border-l-4 border-l-orbital-warning"
                    action={
                        (lowStockItems.length + expiringItems.length) > 0 &&
                        <span className="bg-orbital-danger text-white text-xs font-bold px-2 py-1 rounded-full">
                            {lowStockItems.length + expiringItems.length}
                        </span>
                    }
                >
                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                         {/* Low Stock */}
                         {lowStockItems.slice(0, 3).map(item => (
                            <div key={item.id} className="p-3 bg-orbital-warning/10 border border-orbital-warning/30 rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-bold text-orbital-warning truncate max-w-[70%]">{item.name}</div>
                                    <div className="text-xs font-mono text-orbital-warning/80">{item.quantity} / {item.minStockLevel} {item.baseUnit}</div>
                                </div>
                                <OrbitalButton
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-orbital-warning text-orbital-warning hover:bg-orbital-warning hover:text-orbital-bg"
                                    onClick={() => onAddToPurchase(item, 'LOW_STOCK')}
                                    icon={<ShoppingCart size={14} />}
                                >
                                    Repor Estoque
                                </OrbitalButton>
                            </div>
                         ))}

                         {/* Expiring */}
                         {expiringItems.slice(0, 3).map(item => (
                            <div key={item.id} className="p-3 bg-orbital-danger/10 border border-orbital-danger/30 rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-bold text-orbital-danger truncate max-w-[70%]">{item.name}</div>
                                    <div className="text-xs font-mono text-orbital-danger/80">Vence: {formatDate(item.expiryDate)}</div>
                                </div>
                                <OrbitalButton
                                    size="sm"
                                    variant="danger"
                                    className="w-full"
                                    onClick={() => onAddToPurchase(item, 'EXPIRING')}
                                    icon={<ShoppingCart size={14} />}
                                >
                                    Repor (Vencimento)
                                </OrbitalButton>
                            </div>
                         ))}

                         {(lowStockItems.length === 0 && expiringItems.length === 0) && (
                            <div className="text-center text-orbital-subtext py-4 text-sm">
                                Tudo certo! Nenhuma ação pendente.
                            </div>
                         )}
                    </div>
                </OrbitalCard>

                {/* Pareto Chart */}
                <OrbitalCard title="Top Categorias (Pareto)">
                    <div className="h-[300px]">
                        <Chart options={paretoOptions} series={paretoSeries} type="line" height="100%" />
                    </div>
                </OrbitalCard>
            </div>
        </div>
      </div>
    </PageContainer>
  );
};

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
    subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, onClick, subtitle }) => (
    <OrbitalCard
      className={`h-full transition-all duration-200 ${onClick ? 'cursor-pointer hover:bg-orbital-surface/80 hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <div>
                <div className="text-xs font-display font-bold uppercase tracking-widest text-orbital-subtext mb-1">
                    {title}
                </div>
                <div className={`text-3xl font-mono font-bold ${color} drop-shadow-lg`}>
                    {value}
                </div>
                {subtitle && (
                    <div className="text-xs text-orbital-danger mt-1 font-bold">
                        {subtitle}
                    </div>
                )}
            </div>
            <div className={`p-3 bg-orbital-bg rounded-lg border border-orbital-border shadow-inner ${color}`}>
                {icon}
            </div>
        </div>
    </OrbitalCard>
);
