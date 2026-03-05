

import { InventoryItem, RiskFlags } from '../types';

// Global cache for today's ISO string (Performance Optimization)
let _cachedTodayISO: string = '';
let _lastCacheTime: number = 0;

export const getTodayISO = () => {
    const now = Date.now();
    // Cache for 1 minute to avoid re-calculating string on every render/loop
    if (now - _lastCacheTime > 60000 || !_cachedTodayISO) {
        _cachedTodayISO = new Date().toISOString().split('T')[0];
        _lastCacheTime = now;
    }
    return _cachedTodayISO;
};

// --- CONFIGURAÇÃO DE RISCOS (GHS) ---
export const RISK_CONFIG: Record<keyof RiskFlags, { label: string, color: string, icon: string, textColor?: string }> = {
    F: { label: 'Inflamável (Flammable)', color: 'bg-red-500', icon: 'local_fire_department', textColor: 'text-red-500' },
    F_PLUS: { label: 'Extremamente Inflamável', color: 'bg-red-600', icon: 'local_fire_department', textColor: 'text-red-600' },
    O: { label: 'Oxidante (Oxidizing)', color: 'bg-yellow-400', icon: 'trip_origin', textColor: 'text-yellow-500' },
    T: { label: 'Tóxico (Toxic)', color: 'bg-purple-600', icon: 'skull', textColor: 'text-purple-600' },
    T_PLUS: { label: 'Muito Tóxico (Very Toxic)', color: 'bg-purple-800', icon: 'skull', textColor: 'text-purple-800' },
    C: { label: 'Corrosivo (Corrosive)', color: 'bg-gray-400', icon: 'science', textColor: 'text-gray-600' },
    E: { label: 'Explosivo (Explosive)', color: 'bg-orange-500', icon: 'warning', textColor: 'text-orange-500' },
    N: { label: 'Perigoso ao Meio Ambiente', color: 'bg-emerald-500', icon: 'forest', textColor: 'text-emerald-500' },
    Xi: { label: 'Irritante (Irritant)', color: 'bg-slate-400', icon: 'close', textColor: 'text-slate-500' },
    Xn: { label: 'Nocivo (Harmful)', color: 'bg-slate-400', icon: 'close', textColor: 'text-slate-500' },
};

export const GHS_OPTIONS = (Object.keys(RISK_CONFIG) as Array<keyof RiskFlags>).map(key => ({
    key,
    ...RISK_CONFIG[key]
}));

// --- LÓGICA DE COMPATIBILIDADE ---
export const checkIncompatibility = (source: RiskFlags, target: RiskFlags): string | null => {
    if (source.E || target.E) return "Explosivos (E) devem ser isolados.";
    if ((source.O && target.F) || (source.F && target.O)) return "PERIGO: Oxidantes (O) + Inflamáveis (F).";
    if ((source.O && target.C) || (source.C && target.O)) return "Oxidantes (O) + Corrosivos (C) incompatíveis.";
    return null;
};

// --- LÓGICA DE STATUS DE INVENTÁRIO ---
export type ItemStatusResult = {
    isExpired: boolean;
    isLowStock: boolean;
    status: 'EXPIRED' | 'LOW_STOCK' | 'OK';
    label: string;
    variant: 'danger' | 'warning' | 'success';
    icon: string;
};

// Optimization: Accept 'now' as Date (legacy) or string (optimized), defaulting to cached today string
export const getItemStatus = (item: InventoryItem, now?: Date | string): ItemStatusResult => {
    let isExpired = false;

    if (item.expiryDate) {
        if (typeof now === 'string') {
             // Fastest path: Pre-calculated string comparison
             isExpired = item.expiryDate < now;
        } else if (now instanceof Date) {
             // Legacy/Explicit check with Date object (slower)
             isExpired = new Date(item.expiryDate) < now;
        } else {
             // Default optimization: Internal cached string lookup
             // String comparison is ~10x faster than new Date() parsing
             isExpired = item.expiryDate < getTodayISO();
        }
    }

    const isLowStock = item.quantity <= item.minStockLevel && item.minStockLevel > 0;

    if (isExpired) {
        return { isExpired: true, isLowStock, status: 'EXPIRED', label: 'Vencido', variant: 'danger', icon: 'event_busy' };
    }
    if (isLowStock) {
        return { isExpired: false, isLowStock: true, status: 'LOW_STOCK', label: 'Baixo Estoque', variant: 'warning', icon: 'warning' };
    }
    return { isExpired: false, isLowStock: false, status: 'OK', label: 'Em Estoque', variant: 'success', icon: 'check_circle' };
};

export const mapMovementType = (rawType: string): 'ENTRADA' | 'SAIDA' | 'AJUSTE' => {
    const t = (rawType || '').toLowerCase().trim();
    
    // Entradas
    if (t.includes('entrada') || t.includes('compra') || t.includes('receb') || t.includes('aquis') || t.includes('dev') || t.includes('in') || t === 'e') {
        return 'ENTRADA';
    }
    
    // Saídas
    if (t.includes('saida') || t.includes('saída') || t.includes('consum') || t.includes('baixa') || t.includes('venda') || t.includes('desc') || t.includes('out') || t === 's' || t.includes('doaç')) {
        return 'SAIDA';
    }
    
    // Ajustes
    if (t.includes('ajuste') || t.includes('invent') || t.includes('corr') || t.includes('audit')) {
        return 'AJUSTE';
    }

    // Default para Ajuste se desconhecido
    return 'AJUSTE';
};

// --- LÓGICA DE ANÁLISE DE LOCALIZAÇÃO (Matrix) ---
export const analyzeLocation = (locItems: InventoryItem[]) => {
    const activeRisks: Set<keyof RiskFlags> = new Set();
    let conflictMessage: string | null = null;
    let expiredCount = 0;
    let lowStockCount = 0;

    // Note: We removed explicit 'now' date creation to let getItemStatus use its optimized string cache

    locItems.forEach(item => {
        (Object.keys(item.risks) as Array<keyof RiskFlags>).forEach(riskKey => {
            if (item.risks[riskKey]) activeRisks.add(riskKey);
        });
        const status = getItemStatus(item); // Uses optimized string comparison
        if (status.isExpired) expiredCount++;
        if (status.isLowStock) lowStockCount++;
    });

    // Verificação simplificada de incompatibilidade (O(N^2) limitado pelo tamanho do armário)
    const limitCheck = Math.min(locItems.length, 50); 
    for (let i = 0; i < limitCheck; i++) {
        for (let j = i + 1; j < limitCheck; j++) {
            const msg = checkIncompatibility(locItems[i].risks, locItems[j].risks);
            if (msg) {
                conflictMessage = msg;
                break;
            }
        }
        if (conflictMessage) break;
    }

    return {
        activeRisks: Array.from(activeRisks),
        conflict: conflictMessage,
        count: locItems.length,
        expiredCount,
        lowStockCount
    };
};
