
import { useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';

export interface ABCItem {
    id: string;
    name: string;
    consumption: number;
    percentage: number;
    cumulative: number;
    class: 'A' | 'B' | 'C';
}

export const useReportsAnalytics = (items: InventoryItem[], history: MovementRecord[]) => {
    
    // 1. ABC Analysis (Based on Consumption Quantity)
    const abcAnalysis = useMemo(() => {
        const consumptionMap = new Map<string, number>();
        
        // Sum exits from history
        history.forEach(h => {
            if (h.type === 'SAIDA') {
                const current = consumptionMap.get(h.itemId) || 0;
                consumptionMap.set(h.itemId, current + h.quantity);
            }
        });

        const totalConsumption = Array.from(consumptionMap.values()).reduce((a, b) => a + b, 0);
        
        if (totalConsumption === 0) return [];

        const rankedItems: ABCItem[] = [];
        
        consumptionMap.forEach((qty, itemId) => {
            const item = items.find(i => i.id === itemId);
            if (item) {
                rankedItems.push({
                    id: itemId,
                    name: item.name,
                    consumption: qty,
                    percentage: (qty / totalConsumption) * 100,
                    cumulative: 0,
                    class: 'C'
                });
            }
        });

        // Sort desc
        rankedItems.sort((a, b) => b.consumption - a.consumption);

        // Calculate cumulative and class
        let accumulated = 0;
        rankedItems.forEach(item => {
            accumulated += item.percentage;
            item.cumulative = accumulated;
            if (accumulated <= 80) item.class = 'A';
            else if (accumulated <= 95) item.class = 'B';
            else item.class = 'C';
        });

        return rankedItems;
    }, [items, history]);

    // 2. Controlled Products Map (Mapa de Controlados)
    const controlledReport = useMemo(() => {
        return items.filter(i => i.isControlled).map(item => {
            const itemHistory = history.filter(h => h.itemId === item.id);
            const totalEntry = itemHistory.filter(h => h.type === 'ENTRADA').reduce((acc, h) => acc + h.quantity, 0);
            const totalExit = itemHistory.filter(h => h.type === 'SAIDA').reduce((acc, h) => acc + h.quantity, 0);
            
            // Assuming initial stock is current - entries + exits is tricky without a snapshot date
            // For a simple report, we show current stock and flow in period
            return {
                ...item,
                totalEntry,
                totalExit
            };
        });
    }, [items, history]);

    // 3. Expiry Forecast
    const expiryRisk = useMemo(() => {
        const today = new Date();
        const next90Days = new Date(today);
        next90Days.setDate(today.getDate() + 90);

        const result = items
            .filter(i => i.expiryDate && new Date(i.expiryDate) <= next90Days)
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        return result.map(i => ({
            ...i,
            daysRemaining: Math.ceil((new Date(i.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        }));
    }, [items]);

    // 4. Cost Analysis (Inventory Valuation)
    const costAnalysis = useMemo(() => {
        const details = items.map(item => {
            const unitCost = item.unitCost || 0;
            const total = item.quantity * unitCost;
            return {
                ...item,
                unitCost,
                totalValue: total
            };
        });

        const totalValue = details.reduce((acc, curr) => acc + curr.totalValue, 0);

        // Sort by value desc
        details.sort((a, b) => b.totalValue - a.totalValue);

        return {
            totalValue,
            items: details
        };
    }, [items]);

    // 5. Monthly Flow (Entries vs Exits)
    const monthlyFlow = useMemo(() => {
        const dataMap = new Map<string, { in: number, out: number }>();
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        
        // Generate keys for last 12 months to ensure continuity
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            dataMap.set(key, { in: 0, out: 0 });
        }

        history.forEach(h => {
            const d = new Date(h.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            
            if (dataMap.has(key)) {
                const current = dataMap.get(key)!;
                if (h.type === 'ENTRADA') current.in += h.quantity;
                if (h.type === 'SAIDA') current.out += h.quantity;
            }
        });

        const sortedKeys = Array.from(dataMap.keys()).sort();
        
        return {
            labels: sortedKeys.map(k => {
                const [_, m] = k.split('-');
                return monthNames[parseInt(m) - 1];
            }),
            dataIn: sortedKeys.map(k => dataMap.get(k)!.in),
            dataOut: sortedKeys.map(k => dataMap.get(k)!.out)
        };
    }, [history]);

    return {
        abcAnalysis,
        controlledReport,
        expiryRisk,
        costAnalysis,
        monthlyFlow
    };
};
