
import React, { useMemo, useState } from 'react';
import * as ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// Fix for Minified React error #130 (Element type is invalid)
// Handles differences in CommonJS/ESM interop across environments
const Chart = (ReactApexChart as any).default || ReactApexChart;
import { InventoryItem, MovementRecord } from '../types';
import { Card } from './ui/Card';
import { MetricCard } from './ui/MetricCard';
import { PageContainer } from './ui/PageContainer';
import { Button } from './ui/Button';
import { PageHeader } from './ui/PageHeader'; // Importado
import { formatDateTime, formatDate } from '../utils/formatters';
import { defaultCollator } from '../utils/stringUtils';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import { useTheme } from '../context/ThemeContext';

interface Props {
  items: InventoryItem[];
  history: MovementRecord[];
  onAddToPurchase: (item: InventoryItem, reason: 'LOW_STOCK' | 'EXPIRING') => void;
  onAddStock: (item: InventoryItem) => void;
}

export const Dashboard: React.FC<Props> = ({ items, history, onAddToPurchase }) => {
  const { theme } = useTheme();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  
  const {
      totalItems,
      lowStockItems,
      expiringItems,
      categoryStats,
      recentTransactions,
      chartData,
      movementsToday,
      waterfallSeries,
      waterfallColors
  } = useDashboardAnalytics(items, history, selectedItemId || undefined);

  // --- APEXCHARTS CONFIG ---
  
  // 1. Output Movement (Area Chart) - Default Global
  const movementChartOptions: ApexOptions = {
      chart: {
          id: 'movement-chart',
          type: 'area',
          toolbar: { show: false },
          zoom: { enabled: false },
          selection: { enabled: false },
          fontFamily: 'Inter, sans-serif',
          background: 'transparent'
      },
      colors: ['#903A40'],
      fill: {
          type: 'gradient',
          gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.4,
              opacityTo: 0.05,
              stops: [0, 100]
          }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
          categories: chartData.xData,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: { style: { colors: '#94A3B8' } }
      },
      yaxis: {
          labels: { show: false },
          show: false
      },
      grid: {
          borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
          strokeDashArray: 4,
          yaxis: { lines: { show: true } }
      },
      tooltip: {
          theme: theme,
          y: { formatter: (val) => `${val} unidades` }
      }
  };

  const movementSeries = [{ name: 'Saídas', data: chartData.yData }];

  // 2. Waterfall Chart (Detailed Item Analysis)
  const waterfallOptions: ApexOptions = {
      chart: {
          type: 'rangeBar',
          toolbar: { show: false },
          zoom: { enabled: false },
          selection: { enabled: false },
          fontFamily: 'Inter, sans-serif',
          background: 'transparent',
          animations: { enabled: true }
      },
      colors: waterfallColors, // Colors from hook
      plotOptions: {
          bar: {
              horizontal: false,
              borderRadius: 2,
              columnWidth: '50%',
              distributed: true, // Required for individual bar colors
              rangeBarGroupRows: true
          }
      },
      dataLabels: {
          enabled: true,
          offsetY: -20, // Push label above bar
          style: {
              colors: [theme === 'dark' ? '#fff' : '#334155'],
              fontSize: '11px',
              fontWeight: 700
          },
          formatter: function(val: any, opts: any) {
              const meta = opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex].meta;
              if (meta && meta.delta !== undefined) {
                  // Show Delta (+10, -5)
                  return (meta.delta > 0 ? '+' : '') + meta.delta;
              }
              // Show Absolute Value for Start/End bars
              return val[1]; 
          }
      },
      xaxis: {
           type: 'category',
           labels: { 
               style: { colors: '#94A3B8', fontSize: '11px' }
           },
           axisBorder: { show: false },
           axisTicks: { show: false }
      },
      yaxis: {
          labels: { style: { colors: '#94A3B8' } },
          title: { text: 'Saldo Acumulado', style: { color: '#94A3B8', fontSize: '11px' } }
      },
      grid: {
          borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
          strokeDashArray: 4,
          yaxis: { lines: { show: true } }
      },
      tooltip: { 
          theme: theme,
          custom: function({ seriesIndex, dataPointIndex, w }) {
              const data = w.config.series[seriesIndex].data[dataPointIndex];
              const meta = data.meta;
              
              if (!meta) return '';

              let headerClass = 'bg-gray-100 text-gray-700';
              let bodyContent = '';

              if (meta.delta !== undefined) {
                  // Movement Bar
                  const isPositive = meta.delta >= 0;
                  headerClass = isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
                  bodyContent = `
                    <div class="font-bold text-lg ${isPositive ? 'text-emerald-600' : 'text-red-600'} text-center">
                        ${isPositive ? '+' : ''}${meta.delta}
                    </div>
                    <div class="text-[10px] text-gray-500 mt-1 text-center">
                        Saldo: ${meta.open} ➝ ${meta.close}
                    </div>
                  `;
              } else {
                  // Static Bar (Start/End)
                   headerClass = 'bg-blue-100 text-blue-800';
                   bodyContent = `
                    <div class="font-bold text-lg text-blue-600 text-center">
                        ${meta.value}
                    </div>
                    <div class="text-[10px] text-gray-500 mt-1 text-center">
                        Total Absoluto
                    </div>
                   `;
              }
              
              return `
                <div class="overflow-hidden rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 min-w-[120px]">
                    <div class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${headerClass} text-center">
                        ${meta.label || data.x}
                    </div>
                    <div class="p-3">
                        ${bodyContent}
                    </div>
                </div>
              `;
          }
      },
      legend: { show: false }
  };

  const paretoData = useMemo(() => {
    let accumulated = 0;
    const totalCount = selectedItemId ? 1 : (items.length || 1); 
    
    return categoryStats.map(cat => {
        accumulated += cat.count;
        return {
            name: cat.name,
            count: cat.count,
            cumulative: Math.min(100, Math.round((accumulated / totalCount) * 100))
        };
    });
  }, [categoryStats, items.length, selectedItemId]);

  const paretoOptions: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      selection: { enabled: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent'
    },
    colors: ['#6797A1', '#F59E0B'],
    stroke: { width: [0, 3], curve: 'smooth' },
    plotOptions: {
      bar: { columnWidth: '50%', borderRadius: 4 }
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [1],
      formatter: (val) => `${val}%`
    },
    labels: paretoData.map(d => d.name),
    xaxis: {
        labels: { 
            style: { colors: '#94A3B8', fontSize: '10px' },
            trim: true,
            rotate: -45,
            hideOverlappingLabels: false
        }
    },
    yaxis: [
      {
        title: { text: 'Quantidade', style: { color: '#94A3B8' } },
        labels: { style: { colors: '#94A3B8' } }
      },
      {
        opposite: true,
        title: { text: 'Acumulado (%)', style: { color: '#94A3B8' } },
        max: 100,
        labels: { style: { colors: '#94A3B8' } }
      }
    ],
    legend: { show: false },
    tooltip: { theme: theme }
  };

  const paretoSeries = [
    { name: 'Quantidade', type: 'column', data: paretoData.map(d => d.count) },
    { name: 'Acumulado', type: 'line', data: paretoData.map(d => d.cumulative) }
  ];

  // Options for Dropdown (Optimized for performance)
  // Optimization: Replaced localeCompare with shared Intl.Collator (~2x faster)
  const itemOptions = useMemo(() => {
      const sorted = [...items].sort((a,b) => defaultCollator.compare(a.name, b.name)).slice(0, 500);
      return sorted.map(i => ({ 
          value: i.id, 
          label: `${i.name} ${i.sapCode ? `(${i.sapCode})` : ''} - ${i.lotNumber}` 
      }));
  }, [items]);

  return (
    <PageContainer scrollable={true}>
       {/* PADRONIZAÇÃO: Substituição do Header manual pelo PageHeader */}
       <PageHeader 
            title="Visão Geral" 
            description="Métricas estratégicas e alertas operacionais."
       >
            <div className="w-full md:w-80">
                 <div className="relative">
                     <select
                        className="w-full h-10 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-main dark:text-white text-sm px-3 pr-8 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer shadow-sm appearance-none truncate"
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                     >
                         <option value="">-- Visão Global (Todos) --</option>
                         {itemOptions.map(opt => (
                             <option key={opt.value} value={opt.value}>
                                 {opt.label}
                             </option>
                         ))}
                     </select>
                     <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-secondary">
                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                 </div>
            </div>
       </PageHeader>

      {/* KPI GRID */}
      <div id="tour-kpi" className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-2">
        <div className="flex-1 min-h-0">
            <MetricCard 
                title={selectedItemId ? "Estoque Atual" : "Total de Itens"}
                icon={selectedItemId ? "layers" : "science"}
                value={selectedItemId ? (items.find(i => i.id === selectedItemId)?.quantity || 0) : totalItems.toLocaleString('pt-BR')}
                subValue={selectedItemId ? items.find(i => i.id === selectedItemId)?.baseUnit : <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px] font-bold"><span className="material-symbols-outlined text-[12px]">trending_up</span> +2.5%</span>}
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

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* CHART SECTION */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="flex-1 flex flex-col min-h-[400px]" padding="p-0">
                <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                            {selectedItemId ? (
                                <>
                                    <span className="material-symbols-outlined text-primary">waterfall_chart</span>
                                    Evolução de Saldo (Diário)
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-primary">area_chart</span>
                                    Movimentação de Saída
                                </>
                            )}
                        </h3>
                        <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                            {selectedItemId 
                                ? 'Fluxo líquido e saldo acumulado nos últimos 15 dias com atividade.' 
                                : 'Consumo mensal consolidado de reagentes e materiais.'}
                        </p>
                    </div>
                </div>
                <div className="flex-1 w-full relative p-4 bg-gradient-to-b from-transparent to-background-light/30 dark:to-background-dark/30 touch-pan-y">
                     {selectedItemId && waterfallSeries.length > 0 ? (
                         <Chart options={waterfallOptions} series={waterfallSeries} type="rangeBar" height="100%" />
                     ) : (
                         <Chart options={movementChartOptions} series={movementSeries} type="area" height="100%" />
                     )}
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
                                            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase
                                            ${tx.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                                              tx.type === 'SAIDA' ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                              'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'}
                                        `}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-text-main dark:text-white truncate max-w-[200px]" title={tx.productName}>
                                        {tx.productName}
                                        <div className="text-[11px] text-text-light font-medium mt-0.5 tracking-wide">Lote: <span className="font-mono text-text-secondary">{tx.lot}</span></div>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono font-medium text-text-main dark:text-slate-300">
                                        {tx.quantity} <span className="text-[10px] text-text-light font-sans font-normal uppercase">{tx.unit}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right text-text-secondary dark:text-gray-400 text-[11px] font-medium">
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

        {/* SIDE PANEL */}
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
                
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar p-5">
                    
                    {/* Low Stock Items */}
                    {lowStockItems.slice(0, 3).map(item => (
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
                </div>
            </Card>

            {/* PARETO CHART */}
            {!selectedItemId && (
                <Card padding="p-0" className="flex flex-col min-h-[300px]">
                    <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                        <h3 className="text-lg font-bold text-text-main dark:text-white">Top Categorias (Pareto)</h3>
                    </div>
                    <div className="flex-1 p-4 relative">
                        {paretoData.length > 0 ? (
                            <Chart options={paretoOptions} series={paretoSeries} type="line" height="100%" />
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-text-secondary italic">
                                Sem dados suficientes.
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
      </div>
    </PageContainer>
  );
};
