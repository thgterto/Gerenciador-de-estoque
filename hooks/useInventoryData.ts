
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { InventoryService } from '../services/InventoryService';
import { db } from '../db';
import { seedDatabase } from '../services/DatabaseSeeder';
import { useAlert } from '../context/AlertContext';

const SESSION_KEYS = {
    SETUP_COMPLETED: 'LC_SETUP_COMPLETED',
    SKIP_SEED: 'LC_SKIP_AUTO_SEED',
    DATA_VERSION: 'LC_DATA_VERSION'
};

// Versão atual dos dados.
const CURRENT_DATA_VERSION = '2025-12-23-REAL-V2';

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
                // Opcional: Feedback visual discreto
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
                // 1. Initialize Service (Runs Migrations if needed)
                await InventoryService.initialize();

                const dbCount = await db.rawDb.items.count();
                const setupDone = localStorage.getItem(SESSION_KEYS.SETUP_COMPLETED) === 'true';
                
                // CRITICAL FIX: Não limpar dados existentes automaticamente.
                // Apenas se o banco estiver vazio e nunca tiver sido configurado, oferecemos o setup.
                if (dbCount === 0 && !setupDone) {
                     setShowDbSetup(true);
                } else {
                    // Se já existem dados, apenas atualizamos a flag de versão para evitar prompts futuros
                    localStorage.setItem(SESSION_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
                }

                // 2. Sync Cloud (Opcional)
                try {
                    await InventoryService.syncFromCloud();
                } catch (e) {
                    // Silent fail for offline mode
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
    }, [loadData, addToast]);

    const handleDbSetup = async (type: 'EMPTY' | 'DEMO') => {
        setLoading(true);
        setShowDbSetup(false);
        
        if (type === 'DEMO') {
            await seedDatabase(true); 
            localStorage.removeItem(SESSION_KEYS.SKIP_SEED);
            addToast('Ambiente Configurado', 'success', 'Dados LIMS carregados.');
        } else {
            localStorage.setItem(SESSION_KEYS.SKIP_SEED, 'true');
            addToast('Ambiente Pronto', 'success', 'Banco de dados inicializado vazio.');
        }

        localStorage.setItem(SESSION_KEYS.SETUP_COMPLETED, 'true');
        localStorage.setItem(SESSION_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
        await loadData(true);
    };

    return useMemo(() => ({
        items, history, loading, loadingHistory, metrics, showDbSetup, handleDbSetup, refresh: loadData
    }), [items, history, loading, loadingHistory, metrics, showDbSetup, loadData]);
};
