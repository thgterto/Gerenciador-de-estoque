
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { InventoryService } from '../services/InventoryService';
import { SharePointService } from '../services/SharePointService';
import { db } from '../db';
import { seedDatabase } from '../services/DatabaseSeeder';
import { useAlert } from '../context/AlertContext';

const SESSION_KEYS = {
    SETUP_COMPLETED: 'LC_SETUP_COMPLETED',
    SKIP_SEED: 'LC_SKIP_AUTO_SEED'
};

export const useInventoryData = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [history, setHistory] = useState<MovementRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [metrics, setMetrics] = useState({ alertsCount: 0 });
    const [showDbSetup, setShowDbSetup] = useState(false);
    const { addToast } = useAlert();
    const isMounted = useRef(true);

    const loadData = useCallback(async (checkAlerts = false) => {
        try {
            const [fetchedItems, fetchedMetrics] = await Promise.all([
                InventoryService.getAllItems(),
                InventoryService.getDashboardMetrics()
            ]);

            if (isMounted.current) {
                setItems(fetchedItems);
                setMetrics(fetchedMetrics);
                setLoading(false);
            }

            if (checkAlerts && fetchedMetrics.alertsCount > 0) {
                addToast('Atenção Necessária', 'warning', `Existem ${fetchedMetrics.alertsCount} itens com estoque baixo ou vencidos.`);
            }

            setLoadingHistory(true);
            await new Promise(r => setTimeout(r, 100)); 
            const fetchedHistory = await InventoryService.getHistory();
            if (isMounted.current) {
                setHistory(fetchedHistory);
                setLoadingHistory(false);
            }
        } catch (e) {
            console.error("Failed to load data", e);
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [addToast]);

    useEffect(() => {
        isMounted.current = true;
        
        const init = async () => {
            try {
                // Tenta autenticar e sincronizar com SharePoint
                try {
                    await SharePointService.initialize();
                    await InventoryService.syncFromCloud();
                } catch (e) {
                    console.warn("Modo Offline: Não foi possível conectar ao SharePoint", e);
                }

                const dbCount = await db.rawDb.items.count();
                const skipSeed = localStorage.getItem(SESSION_KEYS.SKIP_SEED) === 'true';

                if (dbCount === 0 && !skipSeed) {
                    // Se não tiver nada no local nem na nuvem, oferece seed
                    setShowDbSetup(true); 
                } 
                
                await loadData(true);
            } catch (error) {
                console.error("Erro na inicialização:", error);
                setLoading(false);
            }
        };
        
        init();

        const unsubscribe = db.subscribe(() => {
            if (isMounted.current) loadData(false);
        });

        return () => {
            isMounted.current = false;
            unsubscribe();
        };
    }, [loadData]);

    const handleDbSetup = async (type: 'EMPTY' | 'DEMO') => {
        setLoading(true);
        setShowDbSetup(false);
        
        if (type === 'DEMO') {
            await seedDatabase(true); 
            localStorage.removeItem(SESSION_KEYS.SKIP_SEED);
            addToast('Ambiente Configurado', 'success', 'Dados de demonstração carregados.');
        } else {
            localStorage.setItem(SESSION_KEYS.SKIP_SEED, 'true');
            addToast('Ambiente Pronto', 'success', 'Banco de dados inicializado vazio.');
        }

        localStorage.setItem(SESSION_KEYS.SETUP_COMPLETED, 'true');
        await loadData(true);
    };

    return useMemo(() => ({
        items, history, loading, loadingHistory, metrics, showDbSetup, handleDbSetup, refresh: loadData
    }), [items, history, loading, loadingHistory, metrics, showDbSetup, loadData]);
};
