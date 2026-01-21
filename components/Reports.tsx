
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { useReportsAnalytics } from '../hooks/useReportsAnalytics';
import { useECharts } from '../hooks/useECharts';
import { formatDate } from '../utils/formatters';
import { Badge } from './ui/Badge';

interface Props {
  items: InventoryItem[];
  history: MovementRecord[];
}

// Chart Components
const ABCChart = React.memo(({ dataA, dataB, dataC }: { dataA: number, dataB: number, dataC: number }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chart = useECharts(chartRef);

    useEffect(() => {
        if (chart) {
            const option = {
                tooltip: { trigger: 'item' },
                legend: { top: '5%', left: 'center' },
                series: [
                    {
                        name: 'Classificação ABC',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        avoidLabelOverlap: false,
                        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
                        label: { show: false, position: 'center' },
                        emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
                        data: [
                            { value: dataA, name: 'Classe A (80% Consumo)', itemStyle: { color: '#10B981' } },
                            { value: dataB, name: 'Classe B (15% Consumo)', itemStyle: { color: '#F59E0B' } },
                            { value: dataC, name: 'Classe C (5% Consumo)', itemStyle: { color: '#EF4444' } }
                        ]
                    }
                ]
            };
            chart.setOption(option);
        }
    }, [chart, dataA, dataB, dataC]);

    return <div ref={chartRef} className="w-full h-[250px]"></div>;
});

const FlowChart = React.memo(({ labels, dataIn, dataOut }: { labels: string[], dataIn: number[], dataOut: number[] }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chart = useECharts(chartRef);

    useEffect(() => {
        if (chart) {
            const option = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' }
                },
                legend: {
                    data: ['Entradas', 'Saídas'],
                    bottom: 0
                },
                grid: {
                    left: '3%', right: '4%', bottom: '10%', top: '3%', containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: labels,
                    axisLine: { show: false },
                    axisTick: { show: false }
                },
                yAxis: {
                    type: 'value',
                    splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } }
                },
                series: [
                    {
                        name: 'Entradas',
                        type: 'bar',
                        data: dataIn,
                        itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] },
                        barMaxWidth: 30
                    },
                    {
                        name: 'Saídas',
                        type: 'bar',
                        data: dataOut,
                        itemStyle: { color: '#EF4444', borderRadius: [4, 4, 0, 0] },
                        barMaxWidth: 30
                    }
                ]
            };
            chart.setOption(option);
        }
    }, [chart, labels, dataIn, dataOut]);

    return <div ref={chartRef} className="w-full h-[350px]"></div>;
});

export const Reports: React.FC<Props> = ({ items, history }) => {
    const [activeTab, setActiveTab] = useState<'ABC' | 'CONTROLLED' | 'EXPIRY' | 'FLOW'>('ABC');
    const { abcAnalysis, controlledReport, expiryRisk, monthlyFlow } = useReportsAnalytics(items, history);
    
    const chartData = useMemo(() => {
        if (activeTab !== 'ABC') return { A: 0, B: 0, C: 0 };
        return {
            A: abcAnalysis.filter(i => i.class === 'A').reduce((acc, i) => acc + i.consumption, 0),
            B: abcAnalysis.filter(i => i.class === 'B').reduce((acc, i) => acc + i.consumption, 0),
            C: abcAnalysis.filter(i => i.class === 'C').reduce((acc, i) => acc + i.consumption, 0)
        };
    }, [abcAnalysis, activeTab]);

    return (
        <PageContainer scrollable={true}>
            <PageHeader 
                title="Relatórios Gerenciais" 
                description="Análise estratégica de estoque, consumo e conformidade."
            >
                <div className="flex bg-surface-light dark:bg-surface-dark p-1 rounded-lg border border-border-light dark:border-border-dark overflow-x-auto no-scrollbar">
                    {[
                        { id: 'ABC', label: 'Curva ABC', icon: 'analytics' },
                        { id: 'FLOW', label: 'Fluxo', icon: 'swap_vert' },
                        { id: 'CONTROLLED', label: 'Controlados', icon: 'verified_user' },
                        { id: 'EXPIRY', label: 'Validade', icon: 'event_busy' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
                                ${activeTab === tab.id 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'text-text-secondary hover:text-text-main dark:text-gray-400 dark:hover:text-white hover:bg-background-light dark:hover:bg-slate-700'
                                }
                            `}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </PageHeader>

            {/* TAB CONTENT: CURVA ABC */}
            {activeTab === 'ABC' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card padding="p-6" className="lg:col-span-1 min-h-[300px]">
                            <h3 className="font-bold text-text-main dark:text-white mb-4">Distribuição de Consumo</h3>
                            {abcAnalysis.length > 0 ? (
                                <ABCChart dataA={chartData.A} dataB={chartData.B} dataC={chartData.C} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-text-secondary italic">
                                    Sem dados de movimentação suficientes.
                                </div>
                            )}
                        </Card>
                        <Card padding="p-0" className="lg:col-span-2 flex flex-col overflow-hidden">
                            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-text-main dark:text-white">Top Itens (Classe A)</h3>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Consumo Total</TableHead>
                                        <TableHead className="text-right">% Acumulado</TableHead>
                                        <TableHead className="text-center">Classe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {abcAnalysis.slice(0, 10).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right font-mono">{item.consumption.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono text-text-secondary">{item.cumulative.toFixed(1)}%</TableCell>
                                            <TableCell className="text-center">
                                                <Badge 
                                                    variant={item.class === 'A' ? 'success' : item.class === 'B' ? 'warning' : 'danger'}
                                                >
                                                    Classe {item.class}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: FLUXO */}
            {activeTab === 'FLOW' && (
                 <div className="flex flex-col gap-6 animate-fade-in">
                    <Card padding="p-6" className="min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-text-main dark:text-white text-lg">Fluxo de Movimentação</h3>
                                <p className="text-sm text-text-secondary dark:text-gray-400">Entradas vs. Saídas (Últimos 12 meses)</p>
                            </div>
                        </div>
                        {history.length > 0 ? (
                            <FlowChart labels={monthlyFlow.labels} dataIn={monthlyFlow.dataIn} dataOut={monthlyFlow.dataOut} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-text-secondary">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-4xl opacity-50 mb-2">bar_chart_off</span>
                                    <p>Nenhuma movimentação registrada.</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Total Entradas (Ano)</h4>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                {monthlyFlow.dataIn.reduce((a, b) => a + b, 0).toLocaleString()} <span className="text-sm font-medium opacity-70">unidades</span>
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                            <h4 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">Total Saídas (Ano)</h4>
                            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                                {monthlyFlow.dataOut.reduce((a, b) => a + b, 0).toLocaleString()} <span className="text-sm font-medium opacity-70">unidades</span>
                            </p>
                        </div>
                    </div>
                 </div>
            )}

            {/* TAB CONTENT: CONTROLLED */}
            {activeTab === 'CONTROLLED' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                     <Card padding="p-0" className="flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="font-bold text-text-main dark:text-white">Mapa de Produtos Controlados</h3>
                            <Button variant="outline" size="sm" icon="print" onClick={() => window.print()}>Imprimir</Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>CAS</TableHead>
                                    <TableHead className="text-right">Saldo Inicial (Est.)</TableHead>
                                    <TableHead className="text-right text-emerald-600">Entradas</TableHead>
                                    <TableHead className="text-right text-red-600">Saídas</TableHead>
                                    <TableHead className="text-right font-bold">Saldo Atual</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {controlledReport.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-text-secondary font-mono">{item.sapCode}</div>
                                        </TableCell>
                                        <TableCell className="font-mono text-text-secondary">{item.casNumber || '-'}</TableCell>
                                        <TableCell className="text-right text-text-secondary">{(item.quantity - item.totalEntry + item.totalExit).toFixed(3)} {item.baseUnit}</TableCell>
                                        <TableCell className="text-right text-emerald-600 font-medium">{item.totalEntry.toFixed(3)}</TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">{item.totalExit.toFixed(3)}</TableCell>
                                        <TableCell className="text-right font-bold bg-primary/5">{item.quantity.toFixed(3)} {item.baseUnit}</TableCell>
                                    </TableRow>
                                ))}
                                {controlledReport.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-text-secondary opacity-60 py-12">
                                            Nenhum produto marcado como "Controlado" no inventário.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}

             {/* TAB CONTENT: EXPIRY RISK */}
             {activeTab === 'EXPIRY' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    <Card padding="p-0" className="flex flex-col overflow-hidden">
                         <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-text-main dark:text-white">Risco de Vencimento (Próximos 90 Dias)</h3>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Validade</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Quantidade em Risco</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expiryRisk.map(item => {
                                    const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="font-mono text-text-secondary">{item.lotNumber}</TableCell>
                                            <TableCell className="font-bold text-text-main dark:text-gray-300">{formatDate(item.expiryDate)}</TableCell>
                                            <TableCell className="text-center">
                                                {days < 0 ? (
                                                    <Badge variant="danger">Vencido</Badge>
                                                ) : (
                                                    <Badge variant="warning">Vence em {days} dias</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{item.quantity} {item.baseUnit}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {expiryRisk.length === 0 && (
                                    <TableRow>
                                         <TableCell colSpan={5} className="text-center text-text-secondary opacity-60 py-12">
                                            Nenhum item vencendo nos próximos 90 dias.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
             )}
        </PageContainer>
    );
};
