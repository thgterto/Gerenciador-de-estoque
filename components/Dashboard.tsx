
import React, { useEffect, useRef } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { Card } from './ui/Card';
import { MetricCard } from './ui/MetricCard';
import { PageContainer } from './ui/PageContainer';
import { Button } from './ui/Button';
import { formatDateTime, formatDate } from '../utils/formatters';
import { useECharts } from '../hooks/useECharts';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';

interface Props {
  items: InventoryItem[];
  history: MovementRecord[];
  onAddToPurchase: (item: InventoryItem, reason: 'LOW_STOCK' | 'EXPIRING') => void;
  onAddStock: (item: InventoryItem) => void;
}

export const Dashboard: React.FC<Props> = ({ items, history, onAddToPurchase }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useECharts(chartRef);
  
  const {
      totalItems,
      lowStockItems,
      expiringItems,
      categoryStats,
      recentTransactions,
      chartData,
      movementsToday 
  } = useDashboardAnalytics(items, history);

  // --- CHART CONFIG ---
  useEffect(() => {
    if (!chartInstance) return;
    
    const option = {
        color: ['#903A40'],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'var(--surface-light)',
            borderColor: '#E2E8F0',
            textStyle: { color: '#1E293B', fontFamily: 'Inter, sans-serif' },
            padding: 12,
            extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;'
        },
        grid: { left: '2%', right: '2%', bottom: '2%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: chartData.xData,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94A3B8', fontSize: 11, margin: 15 }
        },
        yAxis: {
            type: 'value',
            splitLine: { 
                lineStyle: { color: '#E2E8F0', type: 'dashed' } 
            },
            axisLabel: { show: false } 
        },
        series: [{
            name: 'Saídas',
            data: chartData.yData,
            type: 'line',
            smooth: 0.4, 
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { borderWidth: 2, borderColor: '#fff' },
            lineStyle: { width: 3 },
            areaStyle: {
                color: new (window as any).echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(144, 58, 64, 0.2)' }, 
                    { offset: 1, color: 'rgba(144, 58, 64, 0.0)' }
                ])
            }
        }]
    };
    chartInstance.setOption(option);
  }, [chartInstance, chartData]);

  return (
    <PageContainer scrollable={true}>
       <div className="flex flex-col gap-1 mb-8">
            <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white">Visão Geral</h1>
            <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base">Métricas estratégicas e alertas operacionais.</p>
       </div>

      {/* 1. KPI Sections Grid - Grouped by Functionality */}
      <div id="tour-kpi" className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-2">
        
        <div className="flex-1 min-h-0">
            <MetricCard 
                title="Total de Itens"
                icon="science"
                value={totalItems.toLocaleString('pt-BR')}
                subValue={<span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">trending_up</span> +2.5%</span>}
                variant="primary" 
                delay={0}
                className="h-full"
            />
        </div>

        <div className="flex-1 min-h-0">
             <MetricCard 
                title="Fluxo Hoje"
                icon="swap_horiz"
                value={movementsToday}
                subValue={<span className="text-text-secondary dark:text-slate-400 text-[10px] block mt-1">Movimentações registradas</span>}
                variant="info" 
                delay={50}
                className="h-full"
            />
        </div>

        <MetricCard 
            title="Baixo Estoque"
            icon="warning"
            value={lowStockItems.length}
            subValue={<span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">Repor urgente</span>}
            variant="warning"
            delay={100}
            className="h-full"
        />
        <MetricCard 
            title="Vencendo"
            icon="event_busy"
            value={expiringItems.length}
            subValue={<span className="text-red-600 dark:text-red-400 text-[10px] font-bold">Próx. 30 dias</span>}
            variant="danger"
            delay={150}
            className="h-full"
        />
      </div>

      {/* 2. Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Chart Section & Transactions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="flex-1 flex flex-col min-h-[350px]" padding="p-0">
                <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">Movimentação de Saída</h3>
                    <p className="text-xs text-text-secondary dark:text-gray-400">Consumo mensal de reagentes e materiais</p>
                </div>
                <div className="flex-1 w-full relative p-6">
                     <div ref={chartRef} className="w-full h-full absolute inset-0 p-4"></div>
                </div>
            </Card>

            <Card padding="p-0" className="flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-surface-light dark:bg-surface-dark">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">Últimas Transações</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-text-secondary dark:text-gray-400 uppercase bg-background-light dark:bg-background-dark font-semibold border-b border-border-light dark:border-border-dark">
                            <tr>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Item</th>
                                <th className="px-6 py-3 text-right">Qtd</th>
                                <th className="px-6 py-3 text-right">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                            {recentTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-background-light dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <span className={`
                                            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${tx.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                              tx.type === 'SAIDA' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                                              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}
                                        `}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-text-main dark:text-white truncate max-w-[200px]" title={tx.productName}>
                                        {tx.productName}
                                        <div className="text-[10px] text-text-secondary font-normal mt-0.5 font-mono">Lote: {tx.lot}</div>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono font-medium text-text-main dark:text-slate-300">
                                        {tx.quantity} <span className="text-[10px] text-text-light">{tx.unit}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right text-text-secondary dark:text-gray-400 text-xs">
                                        {formatDateTime(tx.date)}
                                    </td>
                                </tr>
                            ))}
                            {recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12">
                                         <div className="flex flex-col items-center justify-center text-text-secondary opacity-60">
                                            <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">receipt_long</span>
                                            <p className="text-sm">Nenhuma movimentação recente.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

        {/* Side Panel (Optimized) */}
        <div className="flex flex-col gap-6">
            <Card className="flex flex-col" padding="p-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                    <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                        Ação Necessária
                        {(lowStockItems.length + expiringItems.length) > 0 && (
                            <span className="bg-red-100 text-red-600 dark:bg-red-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {lowStockItems.length + expiringItems.length}
                            </span>
                        )}
                    </h3>
                </div>
                
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar p-5">
                    
                    {/* Low Stock Items */}
                    {lowStockItems.slice(0, 4).map(item => (
                        <div key={item.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 transition-shadow hover:shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1.5 rounded-md bg-white/60 dark:bg-black/20 text-amber-600 dark:text-amber-400 shrink-0">
                                        <span className="material-symbols-outlined text-[18px]">warning</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-text-main dark:text-white truncate leading-tight" title={item.name}>{item.name}</h4>
                                        <div className="flex items-center gap-2 text-[10px] text-text-secondary dark:text-gray-400 mt-0.5">
                                            <span className="font-mono bg-white/50 dark:bg-black/20 px-1 rounded">SAP: {item.sapCode || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                                <div className="flex flex-col">
                                     <div className="text-[10px] uppercase font-bold text-amber-700/70 dark:text-amber-400/70 tracking-wide">Estoque</div>
                                     <div className="text-xs font-medium text-text-main dark:text-white">
                                        <span className="font-bold text-amber-700 dark:text-amber-400">{item.quantity}</span> 
                                        <span className="text-text-light mx-1">/</span> 
                                        <span className="text-text-secondary">{item.minStockLevel} {item.baseUnit}</span>
                                     </div>
                                </div>
                                <Button 
                                    onClick={() => onAddToPurchase(item, 'LOW_STOCK')}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-3 text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 border border-transparent hover:border-amber-200"
                                >
                                    + Comprar
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Expiring Items */}
                    {expiringItems.slice(0, 3).map(item => (
                        <div key={item.id} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 transition-shadow hover:shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1.5 rounded-md bg-white/60 dark:bg-black/20 text-red-600 dark:text-red-400 shrink-0">
                                        <span className="material-symbols-outlined text-[18px]">event_busy</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-text-main dark:text-white truncate leading-tight" title={item.name}>{item.name}</h4>
                                        <div className="flex items-center gap-2 text-[10px] text-text-secondary dark:text-gray-400 mt-0.5">
                                            <span className="font-mono bg-white/50 dark:bg-black/20 px-1 rounded">Lote: {item.lotNumber}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-red-200/50 dark:border-red-800/30">
                                <div className="flex flex-col">
                                     <div className="text-[10px] uppercase font-bold text-red-700/70 dark:text-red-400/70 tracking-wide">Vence em</div>
                                     <div className="text-xs font-bold text-red-700 dark:text-red-400">
                                        {formatDate(item.expiryDate)}
                                     </div>
                                </div>
                                <Button 
                                    onClick={() => onAddToPurchase(item, 'EXPIRING')}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-3 text-[10px] uppercase font-bold text-red-700 dark:text-red-400 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 border border-transparent hover:border-red-200"
                                >
                                    + Repor
                                </Button>
                            </div>
                        </div>
                    ))}
                    
                    {lowStockItems.length === 0 && expiringItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-text-secondary opacity-60">
                            <span className="material-symbols-outlined text-5xl text-success mb-2">check_circle</span>
                            <p className="text-sm font-medium">Tudo certo por aqui!</p>
                            <p className="text-xs mt-1">Estoque saudável.</p>
                        </div>
                    )}
                </div>
            </Card>

            <Card padding="p-5">
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Top Categorias</h3>
                <div className="space-y-4">
                    {categoryStats.length > 0 ? categoryStats.map((cat, idx) => (
                        <div key={cat.name}>
                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                                <span className="text-text-main dark:text-gray-300">{cat.name}</span>
                                <span className="text-text-secondary">{cat.percent}%</span>
                            </div>
                            <div className="w-full bg-background-light dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div 
                                    className={`h-2 rounded-full ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-primary/70' : 'bg-primary/40'}`} 
                                    style={{ width: `${cat.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-text-secondary italic text-center py-4">Sem dados suficientes.</p>
                    )}
                </div>
            </Card>
        </div>
      </div>
    </PageContainer>
  );
};
