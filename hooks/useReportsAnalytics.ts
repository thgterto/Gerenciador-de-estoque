
import { useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { getItemStatus } from '../utils/businessRules';

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

        return items
            .filter(i => i.expiryDate && new Date(i.expiryDate) <= next90Days)
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    }, [items]);

    return {
        abcAnalysis,
        controlledReport,
        expiryRisk
    };
};
