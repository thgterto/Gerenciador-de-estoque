
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useReportsAnalytics } from '../hooks/useReportsAnalytics';
import { useECharts } from '../hooks/useECharts';
import { formatDate } from '../utils/formatters';

interface Props {
  items: InventoryItem[];
  history: MovementRecord[];
}

// Otimização: Componente de Gráfico isolado para evitar recriação
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
                        itemStyle: {
                            borderRadius: 10,
                            borderColor: '#fff',
                            borderWidth: 2
                        },
                        label: { show: false, position: 'center' },
                        emphasis: {
                            label: { show: true, fontSize: 20, fontWeight: 'bold' }
                        },
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

export const Reports: React.FC<Props> = ({ items, history }) => {
    const [activeTab, setActiveTab] = useState<'ABC' | 'CONTROLLED' | 'EXPIRY'>('ABC');
    const { abcAnalysis, controlledReport, expiryRisk } = useReportsAnalytics(items, history);
    
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
                <div className="flex bg-surface-light dark:bg-surface-dark p-1 rounded-lg border border-border-light dark:border-border-dark">
                    {[
                        { id: 'ABC', label: 'Curva ABC', icon: 'analytics' },
                        { id: 'CONTROLLED', label: 'Controlados', icon: 'verified_user' },
                        { id: 'EXPIRY', label: 'Validade', icon: 'event_busy' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
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
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-surface-light dark:bg-surface-dark text-xs uppercase text-text-secondary dark:text-gray-400 font-semibold border-b border-border-light dark:border-border-dark">
                                        <tr>
                                            <th className="px-6 py-3">Item</th>
                                            <th className="px-6 py-3 text-right">Consumo Total</th>
                                            <th className="px-6 py-3 text-right">% Acumulado</th>
                                            <th className="px-6 py-3 text-center">Classe</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                        {abcAnalysis.slice(0, 10).map((item) => (
                                            <tr key={item.id} className="hover:bg-background-light dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-3 font-medium text-text-main dark:text-white">{item.name}</td>
                                                <td className="px-6 py-3 text-right font-mono">{item.consumption.toFixed(2)}</td>
                                                <td className="px-6 py-3 text-right font-mono text-text-secondary">{item.cumulative.toFixed(1)}%</td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        item.class === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                                        item.class === 'B' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {item.class}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface-light dark:bg-surface-dark text-xs uppercase text-text-secondary dark:text-gray-400 font-semibold border-b border-border-light dark:border-border-dark">
                                    <tr>
                                        <th className="px-6 py-3">Produto</th>
                                        <th className="px-6 py-3">CAS</th>
                                        <th className="px-6 py-3 text-right">Saldo Inicial (Est.)</th>
                                        <th className="px-6 py-3 text-right text-green-600">Entradas</th>
                                        <th className="px-6 py-3 text-right text-red-600">Saídas</th>
                                        <th className="px-6 py-3 text-right font-bold">Saldo Atual</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {controlledReport.map(item => (
                                        <tr key={item.id} className="hover:bg-background-light dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-text-main dark:text-white">
                                                {item.name}
                                                <div className="text-xs text-text-secondary font-mono">{item.sapCode}</div>
                                            </td>
                                            <td className="px-6 py-3 text-text-secondary font-mono">{item.casNumber || '-'}</td>
                                            {/* Estimativa grosseira de saldo inicial para o report: Atual - Entradas + Saidas */}
                                            <td className="px-6 py-3 text-right text-text-secondary">{(item.quantity - item.totalEntry + item.totalExit).toFixed(3)} {item.baseUnit}</td>
                                            <td className="px-6 py-3 text-right text-green-600 font-medium">{item.totalEntry.toFixed(3)}</td>
                                            <td className="px-6 py-3 text-right text-red-600 font-medium">{item.totalExit.toFixed(3)}</td>
                                            <td className="px-6 py-3 text-right font-bold text-text-main dark:text-white bg-primary/5">{item.quantity.toFixed(3)} {item.baseUnit}</td>
                                        </tr>
                                    ))}
                                    {controlledReport.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-text-secondary opacity-60">
                                                Nenhum produto marcado como "Controlado" no inventário.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface-light dark:bg-surface-dark text-xs uppercase text-text-secondary dark:text-gray-400 font-semibold border-b border-border-light dark:border-border-dark">
                                    <tr>
                                        <th className="px-6 py-3">Produto</th>
                                        <th className="px-6 py-3">Lote</th>
                                        <th className="px-6 py-3">Validade</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                        <th className="px-6 py-3 text-right">Quantidade em Risco</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {expiryRisk.map(item => {
                                        const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <tr key={item.id} className="hover:bg-background-light dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-3 font-medium text-text-main dark:text-white">{item.name}</td>
                                                <td className="px-6 py-3 font-mono text-text-secondary">{item.lotNumber}</td>
                                                <td className="px-6 py-3 font-bold text-text-main dark:text-gray-300">{formatDate(item.expiryDate)}</td>
                                                <td className="px-6 py-3 text-center">
                                                    {days < 0 ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">Vencido</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Vence em {days} dias</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono">{item.quantity} {item.baseUnit}</td>
                                            </tr>
                                        );
                                    })}
                                    {expiryRisk.length === 0 && (
                                        <tr>
                                             <td colSpan={5} className="px-6 py-12 text-center text-text-secondary opacity-60">
                                                Nenhum item vencendo nos próximos 90 dias.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
             )}
        </PageContainer>
    );
};
