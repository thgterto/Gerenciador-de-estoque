
import { useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { getItemStatus } from '../utils/businessRules';

export const useDashboardAnalytics = (items: InventoryItem[], history: MovementRecord[], selectedItemId?: string) => {
    
    const analytics = useMemo(() => {
        const now = new Date();
        const todayStr = now.toDateString();
        
        // 1. Filtragem de Contexto (Global vs Item Único)
        const activeItems = selectedItemId ? items.filter(i => i.id === selectedItemId) : items;
        // Filtrar histórico relevante apenas se um item estiver selecionado, senão usamos tudo
        const activeHistory = selectedItemId ? history.filter(h => h.itemId === selectedItemId) : history;

        // 2. KPIs Básicos
        const next30Days = new Date(now);
        next30Days.setDate(now.getDate() + 30);
        
        const lowStockItems = [];
        const expiringItems = [];

        for (const item of activeItems) {
            const status = getItemStatus(item, now);
            if (status.isLowStock) lowStockItems.push(item);
            if (status.isExpired) expiringItems.push(item);
            else if (item.expiryDate) {
                const expDate = new Date(item.expiryDate);
                if (expDate < next30Days && expDate >= now) expiringItems.push(item);
            }
        }

        // 3. Gráfico de Área (Visão Global - Saídas Mensais)
        let movementsToday = 0;
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const buckets = new Map<string, number>(); 
        const xLabels: string[] = [];
        
        // Inicializa buckets dos últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            buckets.set(key, 0);
            xLabels.push(monthNames[d.getMonth()]);
        }

        // Processa histórico total para KPIs globais
        for (const h of activeHistory) {
            const d = new Date(h.date);
            if (d.toDateString() === todayStr) movementsToday++;
            
            if (h.type === 'SAIDA') {
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                if (buckets.has(key)) {
                    buckets.set(key, (buckets.get(key) || 0) + h.quantity);
                }
            }
        }

        const yData = Array.from(buckets.values());

        // --- 4. LÓGICA DE WATERFALL (Saldo Acumulado Diário) ---
        // Apenas calculada se um item específico estiver selecionado
        let wSeries: any[] = [];
        let wColors: string[] = [];
        
        if (selectedItemId && activeItems.length > 0) {
             const currentItem = activeItems[0];
             const currentQty = currentItem.quantity;
             
             // Definir Janela de Tempo (Últimos 15 dias para visualização clara)
             const DAYS_WINDOW = 15;
             const startDate = new Date();
             startDate.setDate(startDate.getDate() - DAYS_WINDOW);
             startDate.setHours(0,0,0,0);

             // 4.1. Filtrar Movimentações na Janela
             const windowMovements = activeHistory.filter(h => new Date(h.date) >= startDate);

             // 4.2. Calcular Saldo Inicial (Retroativo)
             // Saldo Inicial = Saldo Atual - (Entradas) + (Saídas)
             // Isso nos dá exatamente quanto tinhamos no dia 'startDate'
             let netChangeInWindow = 0;
             
             // Agrupamento Diário (Map<DataISO, Delta>)
             const dailyDeltas = new Map<string, number>();
             
             // Inicializa dias zerados para continuidade visual (opcional)
             // for (let i = 0; i <= DAYS_WINDOW; i++) { ... } // Comentado para mostrar apenas dias com atividade

             windowMovements.forEach(h => {
                 let delta = 0;
                 if (h.type === 'ENTRADA') delta = h.quantity;
                 else if (h.type === 'SAIDA') delta = -h.quantity;
                 // Ajustes manuais: assumimos positivo se não for especificado, ou tratamos como reset?
                 // Simplificação: Ajuste entra como delta positivo se não tivermos info anterior.
                 else if (h.type === 'AJUSTE') delta = 0; // Ajustes quebram a lógica de fluxo se não soubermos o valor anterior. Ignorando para não distorcer.

                 netChangeInWindow += delta;

                 // Agrupar por dia (YYYY-MM-DD)
                 // Use a safe fallback for date parsing if 'T' is missing (e.g. legacy data)
                 const dayKey = h.date.includes('T') ? h.date.split('T')[0] : h.date.substring(0, 10);
                 const currentDayDelta = dailyDeltas.get(dayKey) || 0;
                 dailyDeltas.set(dayKey, currentDayDelta + delta);
             });
             
             // O Saldo Inicial é o Atual MENOS tudo que aconteceu.
             const startBalance = Math.max(0, currentQty - netChangeInWindow);

             // 4.3. Construção dos Dados do Gráfico
             const dataPoints: any[] = [];
             
             // Barra 1: Saldo Inicial (Barra Cinza Sólida)
             dataPoints.push({
                 x: 'Início',
                 y: [0, parseFloat(startBalance.toFixed(2))],
                 meta: { label: 'Saldo Inicial', value: startBalance }
             });
             wColors.push('#94A3B8'); // Cinza

             let runningTotal = startBalance;
             
             // Ordena dias cronologicamente
             const sortedDays = Array.from(dailyDeltas.keys()).sort();

             sortedDays.forEach(day => {
                 const delta = dailyDeltas.get(day) || 0;
                 if (Math.abs(delta) < 0.001) return; // Ignora dias sem mudança efetiva

                 const open = runningTotal;
                 const close = runningTotal + delta;
                 
                 // Formata Data (DD/MM)
                 const [, month, d] = day.split('-');
                 const label = `${d}/${month}`;

                 // RangeBar: ApexCharts desenha de Min a Max. A cor indica a direção.
                 dataPoints.push({
                     x: label,
                     y: [parseFloat(open.toFixed(2)), parseFloat(close.toFixed(2))], 
                     meta: { 
                         delta: parseFloat(delta.toFixed(2)),
                         open: parseFloat(open.toFixed(2)),
                         close: parseFloat(close.toFixed(2))
                     }
                 });
                 
                 // Verde se subiu (Entradas > Saídas), Vermelho se desceu
                 wColors.push(delta >= 0 ? '#10B981' : '#EF4444');

                 runningTotal = close;
             });

             // Barra Final: Saldo Atual (Barra Azul Sólida)
             dataPoints.push({
                 x: 'Atual',
                 y: [0, parseFloat(currentQty.toFixed(2))],
                 meta: { label: 'Saldo Atual', value: currentQty }
             });
             wColors.push('#3B82F6'); // Azul

             wSeries = [{ data: dataPoints }];
        }

        return {
            kpis: {
                totalItems: activeItems.length,
                lowStockItems,
                expiringItems,
                movementsToday
            },
            chartData: { xData: xLabels, yData },
            waterfallSeries: wSeries,
            waterfallColors: wColors
        };

    }, [items, history, selectedItemId]);

    // --- CATEGORIES STATS ---
    const categoryStats = useMemo(() => {
        const targetList = selectedItemId ? items.filter(i => i.id === selectedItemId) : items;
        const counts: Record<string, number> = {};
        for (const i of targetList) {
            if (i.category) {
                counts[i.category] = (counts[i.category] || 0) + 1;
            }
        }
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count, percent: Math.round((count / targetList.length) * 100) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [items, selectedItemId]);

    // --- RECENT TRANSACTIONS ---
    const recentTransactions = useMemo(() => {
        const targetHistory = selectedItemId ? history.filter(h => h.itemId === selectedItemId) : history;
        return targetHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    }, [history, selectedItemId]);

    return {
        ...analytics.kpis,
        categoryStats,
        recentTransactions,
        chartData: analytics.chartData,
        waterfallSeries: analytics.waterfallSeries,
        waterfallColors: analytics.waterfallColors
    };
};
