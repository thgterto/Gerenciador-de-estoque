
import { useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { getItemStatus } from '../utils/businessRules';

export const useDashboardAnalytics = (items: InventoryItem[], history: MovementRecord[]) => {
    
    // --- KPIS & DATA ---
    const kpis = useMemo(() => {
        const today = new Date();
        const next30Days = new Date(today);
        next30Days.setDate(today.getDate() + 30);
        const todayStr = today.toDateString();

        const lowStockItems = [];
        const expiringItems = [];

        for (const item of items) {
            const status = getItemStatus(item);
            if (status.isLowStock) lowStockItems.push(item);
            if (status.isExpired) expiringItems.push(item);
            else if (item.expiryDate) {
                const expDate = new Date(item.expiryDate);
                if (expDate < next30Days && expDate >= today) expiringItems.push(item);
            }
        }

        const movementsToday = history.filter(h => {
            const d = new Date(h.date);
            return d.toDateString() === todayStr;
        }).length;

        return {
            totalItems: items.length,
            lowStockItems,
            expiringItems,
            movementsToday
        };
    }, [items, history]);

    // --- CATEGORIES STATS ---
    const categoryStats = useMemo(() => {
        const counts: Record<string, number> = {};
        items.forEach(i => {
            counts[i.category] = (counts[i.category] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count, percent: Math.round((count / items.length) * 100) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }, [items]);

    // --- RECENT TRANSACTIONS ---
    const recentTransactions = useMemo(() => {
        return [...history]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [history]);

    // --- CHART DATA PREPARATION ---
    const chartData = useMemo(() => {
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const now = new Date();
        const xData = [];
        const yData = [];
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthIdx = d.getMonth();
            const year = d.getFullYear();
            xData.push(monthNames[monthIdx]);
            
            let sum = 0;
            // Otimização: Filtrar histórico uma vez ou iterar com check de data
            // Dado que o histórico pode ser grande, um loop simples é melhor que filter para cada mês se o histórico for muito grande, 
            // mas para 6 iterações de meses, filter é ok para datasets pequenos/médios.
            history.forEach(h => {
                const hd = new Date(h.date);
                if (h.type === 'SAIDA' && hd.getMonth() === monthIdx && hd.getFullYear() === year) {
                    sum += h.quantity;
                }
            });
            yData.push(sum);
        }
        return { xData, yData };
    }, [history]);

    return {
        ...kpis,
        categoryStats,
        recentTransactions,
        chartData
    };
};
