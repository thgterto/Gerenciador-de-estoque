
import { useState, useEffect, useRef } from 'react';
import { MovementRecord } from '../types';
import { normalizeStr } from '../utils/stringUtils';
import { db } from '../db';
import { useDebounce } from './useDebounce';

export type MovementTypeFilter = 'ALL' | 'ENTRADA' | 'SAIDA' | 'AJUSTE';
export type DateFilterType = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

interface HistoryStats {
    totalEntries: number;
    totalExits: number;
    totalAdjustments: number;
    batchBalance: number;
}

export const useHistoryFilters = (
    // Removido argumento 'history' array completo
    preselectedItemId?: string | null,
    preselectedBatchId?: string | null
) => {
    const [filtered, setFiltered] = useState<MovementRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<HistoryStats>({ totalEntries: 0, totalExits: 0, totalAdjustments: 0, batchBalance: 0 });

    const [term, setTerm] = useState('');
    const debouncedTerm = useDebounce(term, 400); // Debounce aumentado para queries DB
    
    const [typeFilter, setTypeFilter] = useState<MovementTypeFilter>('ALL');
    const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');

    // Referência para controlar race conditions em queries assíncronas
    const queryIdRef = useRef(0);

    useEffect(() => {
        const fetchHistory = async () => {
            const currentQueryId = ++queryIdRef.current;
            setLoading(true);

            try {
                // 1. Definição do Contexto da Query (Base Collection)
                let collection;
                
                // 2. Filtro de Data (Calculado antes para performance)
                let minDate: string | null = null;
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                
                if (dateFilter === 'TODAY') {
                    minDate = todayStr;
                } else if (dateFilter === 'WEEK') {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    minDate = d.toISOString();
                } else if (dateFilter === 'MONTH') {
                    const d = new Date();
                    d.setDate(d.getDate() - 30);
                    minDate = d.toISOString();
                }

                // Prioridade: Lote > Item > Filtro de Data > Todos
                if (preselectedBatchId) {
                    collection = db.rawDb.history.where('batchId').equals(preselectedBatchId);
                } else if (preselectedItemId) {
                    collection = db.rawDb.history.where('itemId').equals(preselectedItemId);
                } else if (minDate) {
                    // Optimized: Use DB index for date range if we have a date constraint.
                    // This creates a smaller candidate set for the text search.
                    collection = db.rawDb.history.where('date').aboveOrEqual(minDate);
                } else {
                    // Ordenação padrão por data (índice composto seria ideal, mas 'date' funciona)
                    collection = db.rawDb.history.orderBy('date');
                }

                // Sempre reverso (mais recente primeiro)
                collection = collection.reverse();

                // 3. Execução da Query com Filtragem no Worker do Dexie
                // Nota: Usamos filter() JS dentro da chain do Dexie.
                // Embora não use índice para tudo, evita carregar objetos desnecessários na memória do React.

                // Hoist normalization out of the loop for performance
                const termLower = debouncedTerm ? normalizeStr(debouncedTerm) : '';

                const results = await collection.filter((h: MovementRecord) => {
                    // Filtro de Data
                    // Redundant if index used, but harmless/fast double-check, keeps 'TODAY' string logic
                    if (minDate && h.date < minDate) return false;
                    if (dateFilter === 'TODAY' && !h.date.startsWith(todayStr)) return false;

                    // Filtro de Tipo
                    if (typeFilter !== 'ALL' && h.type !== typeFilter) return false;

                    // Busca Textual (Search Term)
                    if (termLower) {
                        const matches = 
                            (h.productName && normalizeStr(h.productName).includes(termLower)) || 
                            (h.sapCode && normalizeStr(h.sapCode).includes(termLower)) || 
                            (h.lot && normalizeStr(h.lot).includes(termLower)) ||
                            (h.observation && normalizeStr(h.observation).includes(termLower));
                        if (!matches) return false;
                    }

                    return true;
                }).toArray();

                // Evita setar estado se o componente desmontou ou nova query iniciou
                if (currentQueryId !== queryIdRef.current) return;

                // 4. Cálculo de Estatísticas (In-memory no resultado filtrado)
                // Como filtramos no DB, o array 'results' é menor e gerenciável.
                let entries = 0, exits = 0, adjustments = 0;
                let balance = 0;

                results.forEach((h: MovementRecord) => {
                    if (h.type === 'ENTRADA') {
                        entries++;
                        balance += h.quantity;
                    } else if (h.type === 'SAIDA') {
                        exits++;
                        balance -= h.quantity;
                    } else if (h.type === 'AJUSTE') {
                        adjustments++;
                        // Ajuste complexo em view filtrada, ignoramos no balanço simples visual
                    }
                });

                setFiltered(results);
                setStats({ 
                    totalEntries: entries, 
                    totalExits: exits, 
                    totalAdjustments: adjustments, 
                    batchBalance: balance 
                });

            } catch (error) {
                console.error("Erro ao filtrar histórico:", error);
            } finally {
                if (currentQueryId === queryIdRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchHistory();

        // Inscreve-se para mudanças no DB para atualizar a tabela em tempo real
        // Otimização: Apenas recarrega se houver mudanças na tabela 'history'
        const unsubscribe = db.subscribe(() => {
            fetchHistory();
        });

        return () => {
            unsubscribe();
        };

    }, [debouncedTerm, typeFilter, dateFilter, preselectedItemId, preselectedBatchId]);

    return {
        term, setTerm,
        typeFilter, setTypeFilter,
        dateFilter, setDateFilter,
        filtered,
        stats,
        loading
    };
};
