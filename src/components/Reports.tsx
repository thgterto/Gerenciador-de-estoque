import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalTable, OrbitalHead, OrbitalBody, OrbitalRow, OrbitalTh, OrbitalTd } from './ui/orbital/OrbitalTable';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import { useReportsAnalytics } from '../hooks/useReportsAnalytics';
import { useECharts } from '../hooks/useECharts';
import { formatDate } from '../utils/formatters';
import {
    BarChart3,
    DollarSign,
    ArrowRightLeft,
    ShieldCheck,
    CalendarX,
    Printer
} from 'lucide-react';

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
                legend: { top: '5%', left: 'center', textStyle: { color: '#f4f4f5' } },
                series: [
                    {
                        name: 'Classificação ABC',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        avoidLabelOverlap: false,
                        itemStyle: { borderRadius: 4, borderColor: '#09090b', borderWidth: 2 },
                        label: { show: false, position: 'center' },
                        emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold', color: '#fff' } },
                        data: [
                            { value: dataA, name: 'Classe A (80%)', itemStyle: { color: '#10b981' } },
                            { value: dataB, name: 'Classe B (15%)', itemStyle: { color: '#f59e0b' } },
                            { value: dataC, name: 'Classe C (5%)', itemStyle: { color: '#ef4444' } }
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
                    bottom: 0,
                    textStyle: { color: '#f4f4f5' }
                },
                grid: {
                    left: '3%', right: '4%', bottom: '10%', top: '3%', containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: labels,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#a1a1aa' }
                },
                yAxis: {
                    type: 'value',
                    splitLine: { lineStyle: { type: 'dashed', color: '#27272a' } },
                    axisLabel: { color: '#a1a1aa' }
                },
                series: [
                    {
                        name: 'Entradas',
                        type: 'bar',
                        data: dataIn,
                        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
                        barMaxWidth: 20
                    },
                    {
                        name: 'Saídas',
                        type: 'bar',
                        data: dataOut,
                        itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
                        barMaxWidth: 20
                    }
                ]
            };
            chart.setOption(option);
        }
    }, [chart, labels, dataIn, dataOut]);

    return <div ref={chartRef} className="w-full h-[350px]"></div>;
});

export const Reports: React.FC<Props> = ({ items, history }) => {
    const [activeTab, setActiveTab] = useState<'ABC' | 'COST' | 'CONTROLLED' | 'EXPIRY' | 'FLOW'>('ABC');
    const { abcAnalysis, controlledReport, expiryRisk, costAnalysis, monthlyFlow } = useReportsAnalytics(items, history);
    
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
                <div className="flex bg-orbital-surface p-1 rounded-none border border-orbital-border overflow-x-auto no-scrollbar">
                    {[
                        { id: 'ABC', label: 'Curva ABC', icon: <BarChart3 size={16} /> },
                        { id: 'COST', label: 'Financeiro', icon: <DollarSign size={16} /> },
                        { id: 'FLOW', label: 'Fluxo', icon: <ArrowRightLeft size={16} /> },
                        { id: 'CONTROLLED', label: 'Controlados', icon: <ShieldCheck size={16} /> },
                        { id: 'EXPIRY', label: 'Validade', icon: <CalendarX size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2
                                ${activeTab === tab.id 
                                    ? 'bg-orbital-accent/10 border-orbital-accent text-orbital-accent'
                                    : 'border-transparent text-orbital-subtext hover:text-orbital-text hover:bg-orbital-bg'
                                }
                            `}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </PageHeader>

            {/* TAB CONTENT: COST ANALYSIS */}
            {activeTab === 'COST' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <OrbitalCard className="bg-orbital-accent/5 border-orbital-accent/20">
                             <h3 className="text-xs font-bold text-orbital-accent uppercase tracking-widest">Valor Total em Estoque</h3>
                             <p className="text-3xl font-mono font-black text-orbital-text mt-2">
                                 {costAnalysis.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </p>
                         </OrbitalCard>
                         <OrbitalCard>
                             <h3 className="text-xs font-bold text-orbital-subtext uppercase tracking-widest">Item Mais Valioso</h3>
                             {costAnalysis.items.length > 0 ? (
                                 <div className="mt-2">
                                     <p className="text-xl font-bold text-orbital-text truncate" title={costAnalysis.items[0].name}>{costAnalysis.items[0].name}</p>
                                     <p className="text-sm font-mono text-orbital-subtext">{costAnalysis.items[0].totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                 </div>
                             ) : <p className="mt-2 text-orbital-subtext italic">--</p>}
                         </OrbitalCard>
                    </div>

                    <OrbitalCard noPadding className="flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-orbital-border bg-orbital-bg/50 flex justify-between items-center">
                            <h3 className="font-bold text-orbital-text uppercase">Detalhamento de Custos</h3>
                        </div>
                        <OrbitalTable className="border-0">
                            <OrbitalHead>
                                <OrbitalRow isHoverable={false}>
                                    <OrbitalTh>Produto</OrbitalTh>
                                    <OrbitalTh align="right">Qtd</OrbitalTh>
                                    <OrbitalTh align="right">Custo Unit.</OrbitalTh>
                                    <OrbitalTh align="right">Total</OrbitalTh>
                                </OrbitalRow>
                            </OrbitalHead>
                            <OrbitalBody>
                                {costAnalysis.items.slice(0, 50).map(item => (
                                    <OrbitalRow key={item.id}>
                                        <OrbitalTd>
                                            <div className="font-bold text-orbital-text">{item.name}</div>
                                            <div className="text-xs text-orbital-subtext font-mono">{item.lotNumber}</div>
                                        </OrbitalTd>
                                        <OrbitalTd align="right"><span className="font-mono">{item.quantity} {item.baseUnit}</span></OrbitalTd>
                                        <OrbitalTd align="right">
                                            <span className="font-mono text-orbital-subtext">
                                                {item.unitCost ? item.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                            </span>
                                        </OrbitalTd>
                                        <OrbitalTd align="right">
                                            <span className="font-bold font-mono text-orbital-text">
                                                {item.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </OrbitalTd>
                                    </OrbitalRow>
                                ))}
                                {costAnalysis.items.length === 0 && (
                                    <OrbitalRow isHoverable={false}>
                                        <td colSpan={4} className="text-center text-orbital-subtext opacity-60 py-12">
                                            Sem dados de custo registrados.
                                        </td>
                                    </OrbitalRow>
                                )}
                            </OrbitalBody>
                        </OrbitalTable>
                    </OrbitalCard>
                </div>
            )}

            {/* TAB CONTENT: CURVA ABC */}
            {activeTab === 'ABC' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <OrbitalCard className="lg:col-span-1 min-h-[300px]">
                            <h3 className="font-bold text-orbital-text mb-4 uppercase">Distribuição de Consumo</h3>
                            {abcAnalysis.length > 0 ? (
                                <ABCChart dataA={chartData.A} dataB={chartData.B} dataC={chartData.C} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-orbital-subtext italic">
                                    Sem dados de movimentação suficientes.
                                </div>
                            )}
                        </OrbitalCard>
                        <OrbitalCard noPadding className="lg:col-span-2 flex flex-col overflow-hidden">
                            <div className="px-6 py-4 border-b border-orbital-border bg-orbital-bg/50">
                                <h3 className="font-bold text-orbital-text uppercase">Top Itens (Classe A)</h3>
                            </div>
                            <OrbitalTable className="border-0">
                                <OrbitalHead>
                                    <OrbitalRow isHoverable={false}>
                                        <OrbitalTh>Item</OrbitalTh>
                                        <OrbitalTh align="right">Consumo Total</OrbitalTh>
                                        <OrbitalTh align="right">% Acumulado</OrbitalTh>
                                        <OrbitalTh align="center">Classe</OrbitalTh>
                                    </OrbitalRow>
                                </OrbitalHead>
                                <OrbitalBody>
                                    {abcAnalysis.slice(0, 10).map((item) => (
                                        <OrbitalRow key={item.id}>
                                            <OrbitalTd><span className="font-bold text-orbital-text">{item.name}</span></OrbitalTd>
                                            <OrbitalTd align="right"><span className="font-mono">{item.consumption.toFixed(2)}</span></OrbitalTd>
                                            <OrbitalTd align="right"><span className="font-mono text-orbital-subtext">{item.cumulative.toFixed(1)}%</span></OrbitalTd>
                                            <OrbitalTd align="center">
                                                <OrbitalBadge
                                                    variant={item.class === 'A' ? 'success' : item.class === 'B' ? 'warning' : 'danger'}
                                                    label={`Classe ${item.class}`}
                                                />
                                            </OrbitalTd>
                                        </OrbitalRow>
                                    ))}
                                </OrbitalBody>
                            </OrbitalTable>
                        </OrbitalCard>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: FLUXO */}
            {activeTab === 'FLOW' && (
                 <div className="flex flex-col gap-6 animate-fade-in">
                    <OrbitalCard className="min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-orbital-text text-lg uppercase">Fluxo de Movimentação</h3>
                                <p className="text-sm text-orbital-subtext">Entradas vs. Saídas (Últimos 12 meses)</p>
                            </div>
                        </div>
                        {history.length > 0 ? (
                            <FlowChart labels={monthlyFlow.labels} dataIn={monthlyFlow.dataIn} dataOut={monthlyFlow.dataOut} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-orbital-subtext">
                                <div className="text-center">
                                    <ArrowRightLeft size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>Nenhuma movimentação registrada.</p>
                                </div>
                            </div>
                        )}
                    </OrbitalCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded border bg-orbital-success/10 border-orbital-success/20">
                            <h4 className="text-xs font-bold text-orbital-success uppercase tracking-widest">Total Entradas (Ano)</h4>
                            <p className="text-2xl font-mono font-black text-orbital-success mt-1">
                                {monthlyFlow.dataIn.reduce((a, b) => a + b, 0).toLocaleString()} <span className="text-sm font-medium opacity-70">unidades</span>
                            </p>
                        </div>
                        <div className="p-4 rounded border bg-orbital-danger/10 border-orbital-danger/20">
                            <h4 className="text-xs font-bold text-orbital-danger uppercase tracking-widest">Total Saídas (Ano)</h4>
                            <p className="text-2xl font-mono font-black text-orbital-danger mt-1">
                                {monthlyFlow.dataOut.reduce((a, b) => a + b, 0).toLocaleString()} <span className="text-sm font-medium opacity-70">unidades</span>
                            </p>
                        </div>
                    </div>
                 </div>
            )}

            {/* TAB CONTENT: CONTROLLED */}
            {activeTab === 'CONTROLLED' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                     <OrbitalCard noPadding className="flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-orbital-border bg-orbital-bg/50 flex justify-between items-center">
                            <h3 className="font-bold text-orbital-text uppercase">Mapa de Produtos Controlados</h3>
                            <OrbitalButton variant="outline" size="sm" icon={<Printer size={16} />} onClick={() => window.print()}>Imprimir</OrbitalButton>
                        </div>
                        <OrbitalTable className="border-0">
                            <OrbitalHead>
                                <OrbitalRow isHoverable={false}>
                                    <OrbitalTh>Produto</OrbitalTh>
                                    <OrbitalTh>CAS</OrbitalTh>
                                    <OrbitalTh align="right">Saldo Inicial</OrbitalTh>
                                    <OrbitalTh align="right" className="text-orbital-success">Entradas</OrbitalTh>
                                    <OrbitalTh align="right" className="text-orbital-danger">Saídas</OrbitalTh>
                                    <OrbitalTh align="right">Saldo Atual</OrbitalTh>
                                </OrbitalRow>
                            </OrbitalHead>
                            <OrbitalBody>
                                {controlledReport.map(item => (
                                    <OrbitalRow key={item.id}>
                                        <OrbitalTd>
                                            <div className="font-bold text-orbital-text">{item.name}</div>
                                            <div className="text-xs text-orbital-subtext font-mono">{item.sapCode}</div>
                                        </OrbitalTd>
                                        <OrbitalTd className="font-mono text-orbital-subtext">{item.casNumber || '-'}</OrbitalTd>
                                        <OrbitalTd align="right" className="text-orbital-subtext">{(item.quantity - item.totalEntry + item.totalExit).toFixed(3)} {item.baseUnit}</OrbitalTd>
                                        <OrbitalTd align="right" className="text-orbital-success font-bold font-mono">{item.totalEntry.toFixed(3)}</OrbitalTd>
                                        <OrbitalTd align="right" className="text-orbital-danger font-bold font-mono">{item.totalExit.toFixed(3)}</OrbitalTd>
                                        <OrbitalTd align="right" className="font-black font-mono text-orbital-accent">{item.quantity.toFixed(3)} {item.baseUnit}</OrbitalTd>
                                    </OrbitalRow>
                                ))}
                                {controlledReport.length === 0 && (
                                    <OrbitalRow isHoverable={false}>
                                        <td colSpan={6} className="text-center text-orbital-subtext opacity-60 py-12">
                                            Nenhum produto marcado como "Controlado" no inventário.
                                        </td>
                                    </OrbitalRow>
                                )}
                            </OrbitalBody>
                        </OrbitalTable>
                    </OrbitalCard>
                </div>
            )}

             {/* TAB CONTENT: EXPIRY RISK */}
             {activeTab === 'EXPIRY' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    <OrbitalCard noPadding className="flex flex-col overflow-hidden">
                         <div className="px-6 py-4 border-b border-orbital-border bg-orbital-bg/50">
                            <h3 className="font-bold text-orbital-text uppercase">Risco de Vencimento (Próximos 90 Dias)</h3>
                        </div>
                        <OrbitalTable className="border-0">
                            <OrbitalHead>
                                <OrbitalRow isHoverable={false}>
                                    <OrbitalTh>Produto</OrbitalTh>
                                    <OrbitalTh>Lote</OrbitalTh>
                                    <OrbitalTh>Validade</OrbitalTh>
                                    <OrbitalTh align="center">Status</OrbitalTh>
                                    <OrbitalTh align="right">Qtd em Risco</OrbitalTh>
                                </OrbitalRow>
                            </OrbitalHead>
                            <OrbitalBody>
                                {expiryRisk.map(item => {
                                    const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <OrbitalRow key={item.id}>
                                            <OrbitalTd><span className="font-bold text-orbital-text">{item.name}</span></OrbitalTd>
                                            <OrbitalTd className="font-mono text-orbital-subtext">{item.lotNumber}</OrbitalTd>
                                            <OrbitalTd className="font-bold text-orbital-text">{formatDate(item.expiryDate)}</OrbitalTd>
                                            <OrbitalTd align="center">
                                                {days < 0 ? (
                                                    <OrbitalBadge variant="danger" label="Vencido" />
                                                ) : (
                                                    <OrbitalBadge variant="warning" label={`Vence em ${days} dias`} />
                                                )}
                                            </OrbitalTd>
                                            <OrbitalTd align="right" className="font-mono">{item.quantity} {item.baseUnit}</OrbitalTd>
                                        </OrbitalRow>
                                    );
                                })}
                                {expiryRisk.length === 0 && (
                                    <OrbitalRow isHoverable={false}>
                                         <td colSpan={5} className="text-center text-orbital-subtext opacity-60 py-12">
                                            Nenhum item vencendo nos próximos 90 dias.
                                        </td>
                                    </OrbitalRow>
                                )}
                            </OrbitalBody>
                        </OrbitalTable>
                    </OrbitalCard>
                </div>
             )}
        </PageContainer>
    );
};
