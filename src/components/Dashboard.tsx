import React from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import { InventoryItem, MovementRecord } from '../types';
import { formatDate, formatDateTime } from '../utils/formatters';

// Icons
import {
    Box,
    DollarSign,
    AlertTriangle,
    CalendarClock,
    History,
    ArrowRight,
    ShoppingCart,
    Activity
} from 'lucide-react';

// Orbital UI
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { OrbitalStat } from './ui/orbital/OrbitalStat';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import { OrbitalButton } from './ui/orbital/OrbitalButton';

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

  // Chart Configuration for Orbital Theme
  const commonChartOptions: ApexCharts.ApexOptions = {
    chart: {
        toolbar: { show: false },
        background: 'transparent',
        fontFamily: '"JetBrains Mono", monospace',
        foreColor: '#94a3b8' // Slate 400
    },
    colors: ['#22d3ee', '#f59e0b'], // Cyan-400, Amber-500
    grid: {
        borderColor: '#334155', // Slate 700
        strokeDashArray: 4,
    },
    tooltip: {
        theme: 'dark',
        style: {
            fontSize: '12px',
            fontFamily: '"JetBrains Mono", monospace',
        }
    }
  };

  const paretoOptions: ApexCharts.ApexOptions = {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: 'line' },
    colors: ['#22d3ee', '#f1f5f9'], // Cyan, Slate-100 for line
    stroke: { width: [0, 2], curve: 'straight' },
    plotOptions: {
      bar: { columnWidth: '60%', borderRadius: 0 } // Sharp corners
    },
    dataLabels: { enabled: false },
    xaxis: {
        categories: paretoData.map((d: { category: string }) => d.category),
        labels: { style: { colors: '#94a3b8', fontSize: '10px' } }
    },
    yaxis: [
      { title: { text: 'Valor Total', style: { color: '#94a3b8' } } },
      { opposite: true, title: { text: 'Acumulado %', style: { color: '#94a3b8' } }, max: 100 }
    ],
    legend: { position: 'top', horizontalAlign: 'right' }
  };

  const paretoSeries = [
    { name: 'Valor (R$)', type: 'column', data: paretoData.map((d: { value: number }) => d.value) },
    { name: '% Acumulado', type: 'line', data: paretoData.map((d: { accumulatedPercentage: number }) => d.accumulatedPercentage) }
  ];

  const totalIssues = lowStockItems.length + expiringItems.length;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1920px] mx-auto w-full overflow-y-auto custom-scrollbar h-full bg-orbital-bg text-gray-200">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-orbital-border pb-4 gap-4">
          <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight uppercase">
                  Orbital Command
              </h1>
              <p className="text-gray-400 font-mono text-sm mt-1">
                  System Status: <span className="text-orbital-success">ONLINE</span> // Sector: LOGISTICS
              </p>
          </div>
          <div className="flex gap-2">
               <OrbitalButton
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/reports')}
                  startIcon={<Activity size={14} />}
               >
                  Relatórios
               </OrbitalButton>
               <OrbitalButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/inventory')}
                  endIcon={<ArrowRight size={14} />}
               >
                  Inventário
               </OrbitalButton>
          </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <OrbitalStat
              label="Total Itens"
              value={totalItems}
              icon={<Box />}
              color="primary"
              onClick={() => navigate('/inventory')}
              trend="neutral"
           />
           <OrbitalStat
              label="Valor em Estoque"
              value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={<DollarSign />}
              color="success"
              trend="up"
              trendValue="+2.4%" // Mock trend
           />
           <OrbitalStat
              label="Estoque Crítico"
              value={lowStockItems.length}
              subtitle={outOfStockItems.length > 0 ? `${outOfStockItems.length} zerados` : undefined}
              icon={<AlertTriangle />}
              color="warning"
              trend={lowStockItems.length > 0 ? 'down' : 'neutral'}
           />
           <OrbitalStat
              label="Vencimentos"
              value={expiringItems.length}
              icon={<CalendarClock />}
              color="danger"
              trend={expiringItems.length > 0 ? 'down' : 'neutral'}
           />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Transactions - Takes 8 cols */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            <OrbitalCard
                title="Movimentações Recentes"
                className="h-full min-h-[400px]"
                action={
                    <OrbitalButton variant="ghost" size="sm" onClick={() => navigate('/history')} endIcon={<ArrowRight size={14} />}>
                        Ver Tudo
                    </OrbitalButton>
                }
                noPadding
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-orbital-card/50 border-b border-orbital-border text-xs font-mono text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-normal">Tipo</th>
                                <th className="p-4 font-normal">Item / Lote</th>
                                <th className="p-4 font-normal text-right">Qtd</th>
                                <th className="p-4 font-normal text-right">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-orbital-border/50 font-mono text-sm">
                            {recentTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <OrbitalBadge
                                            label={tx.type}
                                            color={tx.type === 'ENTRADA' ? 'success' : tx.type === 'SAIDA' ? 'default' : 'warning'}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-200 group-hover:text-orbital-primary transition-colors">
                                            {tx.productName}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">Lote: {tx.lot}</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="font-bold">{tx.quantity}</span> <span className="text-xs text-gray-500">{tx.unit}</span>
                                    </td>
                                    <td className="p-4 text-right text-gray-400 text-xs">
                                        {formatDateTime(tx.date)}
                                    </td>
                                </tr>
                            ))}
                            {recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 font-mono text-sm italic">
                                        // Nenhuma movimentação registrada nas últimas 24h
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </OrbitalCard>
        </div>

        {/* Action & Charts - Takes 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Action Required */}
            <OrbitalCard
                title="Prioridade de Ação"
                className={`border-l-4 ${totalIssues > 0 ? 'border-l-orbital-danger' : 'border-l-orbital-success'}`}
                action={totalIssues > 0 && <OrbitalBadge label={`${totalIssues} pendentes`} color="danger" />}
            >
                <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                     {/* Low Stock */}
                     {lowStockItems.slice(0, 3).map(item => (
                        <div key={item.id} className="p-3 bg-orbital-accent/5 border border-orbital-accent/20 rounded-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-orbital-accent truncate max-w-[70%]">{item.name}</span>
                                <span className="text-xs font-mono text-gray-400">{item.quantity} / {item.minStockLevel}</span>
                            </div>
                            <OrbitalButton
                                variant="secondary"
                                size="sm"
                                className="w-full text-xs !py-1 !px-2 border-orbital-accent/50 text-orbital-accent hover:bg-orbital-accent/10"
                                onClick={() => onAddToPurchase(item, 'LOW_STOCK')}
                                startIcon={<ShoppingCart size={12} />}
                            >
                                Repor Estoque
                            </OrbitalButton>
                        </div>
                     ))}

                     {/* Expiring */}
                     {expiringItems.slice(0, 3).map(item => (
                        <div key={item.id} className="p-3 bg-orbital-danger/5 border border-orbital-danger/20 rounded-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-orbital-danger truncate max-w-[70%]">{item.name}</span>
                                <span className="text-xs font-mono text-gray-400">Vence: {formatDate(item.expiryDate)}</span>
                            </div>
                            <OrbitalButton
                                variant="danger"
                                size="sm"
                                className="w-full text-xs !py-1 !px-2"
                                onClick={() => onAddToPurchase(item, 'EXPIRING')}
                                startIcon={<ShoppingCart size={12} />}
                            >
                                Repor (Vencimento)
                            </OrbitalButton>
                        </div>
                     ))}

                     {(totalIssues === 0) && (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2 opacity-50">
                            <Activity size={32} />
                            <span className="text-sm font-mono uppercase tracking-widest text-center">Nenhuma ação necessária</span>
                        </div>
                     )}
                </div>
            </OrbitalCard>

            {/* Pareto Chart */}
            <OrbitalCard title="Análise ABC (Pareto)" className="flex-grow min-h-[300px]" noPadding>
                <div className="p-2 h-full">
                    <Chart options={paretoOptions} series={paretoSeries} type="line" height={280} />
                </div>
            </OrbitalCard>
        </div>

      </div>
    </div>
  );
};
