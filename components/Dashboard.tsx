import React, { useState } from 'react';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import Chart from 'react-apexcharts';
import { useNavigate } from 'react-router-dom';
import { Icon } from './ui/Icon';
import { InventoryItem, MovementRecord } from '../types';
import { formatDate, formatDateTime } from '../utils/formatters';
import { motion, Variants } from 'framer-motion';

interface DashboardProps {
  items: InventoryItem[];
  history: MovementRecord[];
  onAddToPurchase: (item: InventoryItem, reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL') => void;
  onAddStock: (item: InventoryItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ items, history, onAddToPurchase, onAddStock: _onAddStock }) => {
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
  const [selectedItemId] = useState<string | null>(null);

  // --- CHART CONFIGURATIONS (High Contrast / Brutalist) ---
  const commonChartOptions: ApexCharts.ApexOptions = {
    chart: {
        toolbar: { show: false },
        background: 'transparent',
        fontFamily: '"Space Grotesk", sans-serif'
    },
    colors: ['#525252'],
    grid: {
        borderColor: '#e5e5e5',
        strokeDashArray: 0,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
    },
    tooltip: { theme: 'dark' }
  };

  const paretoOptions: ApexCharts.ApexOptions = {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: 'line' },
    colors: ['#CCFF00', '#000000'], // Acid Green & Black
    stroke: { width: [0, 3], curve: 'stepline' as const },
    plotOptions: {
      bar: { columnWidth: '60%', borderRadius: 0 } // Sharp corners
    },
    dataLabels: { enabled: false },
    xaxis: {
        categories: paretoData.map((d: any) => d.category),
        labels: { style: { fontWeight: 700, fontSize: '10px' } }
    },
    yaxis: [
      { title: { text: 'Valor Total', style: { fontWeight: 700 } } },
      { opposite: true, title: { text: 'Acumulado %', style: { fontWeight: 700 } }, max: 100 }
    ],
    legend: { position: 'top', fontWeight: 700 }
  };

  const paretoSeries = [
    { name: 'Valor (R$)', type: 'column', data: paretoData.map((d: any) => d.value) },
    { name: '% Acumulado', type: 'line', data: paretoData.map((d: any) => d.accumulatedPercentage) }
  ];

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 50, damping: 15 }
    }
  };

  return (
    <PageContainer scrollable>
      <PageHeader
          title="Dashboard"
          description="Visão Geral Operacional"
      />

      {/* FRAGMENTED GRID LAYOUT (MAESTRO STYLE) */}
      <motion.div
        className="grid grid-cols-12 gap-6 pb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* ROW 1: KPIs (Staggered / Asymmetrical) */}
        <motion.div className="col-span-12 lg:col-span-3" variants={itemVariants}>
             <Card variant="metric" title="Total de Itens" value={totalItems} icon="inventory_2"
                   className="bg-white border-black h-full"
                   onClick={() => navigate('/inventory')}
             />
        </motion.div>
        <motion.div className="col-span-12 lg:col-span-3" variants={itemVariants}>
             <Card variant="metric" title="Valor em Estoque" value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon="payments"
                   className="bg-white border-black h-full"
             />
        </motion.div>
        <motion.div className="col-span-12 lg:col-span-3" variants={itemVariants}>
             <Card variant="metric" title="Baixo Estoque" value={lowStockItems.length} subtitle={outOfStockItems.length > 0 ? `${outOfStockItems.length} zerados` : undefined} icon="warning"
                   colorScheme={lowStockItems.length > 0 ? 'warning' : 'neutral'}
                   className={lowStockItems.length > 0 ? 'bg-warning-bg border-warning' : 'bg-white border-black'}
             />
        </motion.div>
        <motion.div className="col-span-12 lg:col-span-3" variants={itemVariants}>
             <Card variant="metric" title="A Vencer" value={expiringItems.length} icon="event_busy"
                   colorScheme={expiringItems.length > 0 ? 'danger' : 'neutral'}
                   className={expiringItems.length > 0 ? 'bg-danger-bg border-danger' : 'bg-white border-black'}
             />
        </motion.div>

        {/* ROW 2: MAIN CONTENT & SIDEBAR */}

        {/* Main Content Area (Transactions) */}
        <motion.div className="col-span-12 lg:col-span-8 flex flex-col gap-6" variants={itemVariants}>
            <Card title="Movimentações Recentes" icon="history" className="min-h-[400px]" padding="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black text-white uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Item</th>
                                <th className="px-6 py-4 text-right">Qtd</th>
                                <th className="px-6 py-4 text-right">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {recentTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`
                                            px-2 py-1 text-[10px] font-bold uppercase tracking-wide border
                                            ${tx.type === 'ENTRADA'
                                                ? 'bg-success-bg text-success border-success'
                                                : tx.type === 'SAIDA'
                                                    ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
                                                    : 'bg-warning-bg text-warning border-warning'}
                                        `}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-text-main truncate max-w-[200px]" title={tx.productName}>
                                        {tx.productName}
                                        <div className="text-[10px] text-text-light font-mono mt-0.5">Lote: {tx.lot}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-text-main">
                                        {tx.quantity} <span className="text-[10px] text-text-light font-sans font-normal uppercase">{tx.unit}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-text-secondary text-[10px] font-mono">
                                        {formatDateTime(tx.date)}
                                    </td>
                                </tr>
                            ))}
                            {recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-text-secondary italic">
                                        Nenhuma movimentação recente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>

        {/* Side Panel (Action Items & Charts) */}
        <motion.div className="col-span-12 lg:col-span-4 flex flex-col gap-6" variants={itemVariants}>

            {/* Action Required Panel - Brutalist Alert Style */}
            <Card className="flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" padding="p-0">
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-primary">
                    <h3 className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                        Ação Necessária
                        {(lowStockItems.length + expiringItems.length) > 0 && (
                            <span className="bg-black text-primary text-[10px] px-2 py-0.5 font-mono font-bold">
                                {lowStockItems.length + expiringItems.length}
                            </span>
                        )}
                    </h3>
                </div>
                
                <div className="flex flex-col gap-4 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar p-6 bg-white">
                    
                    {/* Low Stock Items */}
                    {lowStockItems.slice(0, 3).map(item => (
                        <div key={item.id} className="p-4 bg-warning-bg border-2 border-black transition-transform hover:-translate-y-1 hover:shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Icon name="warning" className="text-warning" size={20} />
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-black truncate uppercase leading-tight" title={item.name}>{item.name}</h4>
                                        <div className="font-mono text-[10px] text-text-secondary mt-1">SAP: {item.sapCode || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/10">
                                <div className="flex flex-col">
                                     <div className="text-[10px] uppercase font-bold text-text-light tracking-wide">Estoque</div>
                                     <div className="text-xs font-bold text-black font-mono">
                                        <span className="text-warning">{item.quantity}</span>
                                        <span className="text-text-light mx-1">/</span> 
                                        <span>{item.minStockLevel} {item.baseUnit}</span>
                                     </div>
                                </div>
                                <Button 
                                    onClick={() => onAddToPurchase(item, 'LOW_STOCK')}
                                    variant="warning"
                                    size="sm"
                                    className="text-[10px]"
                                >
                                    COMPRAR
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Expiring Items */}
                    {expiringItems.slice(0, 3).map(item => (
                        <div key={item.id} className="p-4 bg-danger-bg border-2 border-black transition-transform hover:-translate-y-1 hover:shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Icon name="event_busy" className="text-danger" size={20} />
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-black truncate uppercase leading-tight" title={item.name}>{item.name}</h4>
                                        <div className="font-mono text-[10px] text-text-secondary mt-1">Lote: {item.lotNumber}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/10">
                                <div className="flex flex-col">
                                     <div className="text-[10px] uppercase font-bold text-text-light tracking-wide">Vence em</div>
                                     <div className="text-xs font-bold text-danger font-mono">
                                        {formatDate(item.expiryDate)}
                                     </div>
                                </div>
                                <Button 
                                    onClick={() => onAddToPurchase(item, 'EXPIRING')}
                                    variant="danger"
                                    size="sm"
                                    className="text-[10px]"
                                >
                                    REPOR
                                </Button>
                            </div>
                        </div>
                    ))}

                    {(lowStockItems.length === 0 && expiringItems.length === 0) && (
                        <div className="text-center py-8 text-text-secondary italic">
                            Tudo certo! Nenhuma ação pendente.
                        </div>
                    )}
                </div>
            </Card>

            {/* PARETO CHART - Brutalist Style */}
            {!selectedItemId && (
                <Card padding="p-0" className="flex flex-col min-h-[300px]">
                    <div className="px-6 py-4 border-b-2 border-black bg-black text-white">
                        <h3 className="text-lg font-bold uppercase tracking-widest">Top Categorias</h3>
                    </div>
                    <div className="flex-1 p-4 relative bg-white">
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
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};
