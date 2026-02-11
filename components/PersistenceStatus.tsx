import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/ApiClient';

export const PersistenceStatus: React.FC = () => {
    const [status, setStatus] = useState<'IDLE' | 'SAVING' | 'ERROR'>('IDLE');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        if (!ApiClient.isElectron()) return;

        const handleStart = () => setStatus('SAVING');
        const handleEnd = () => {
            setStatus('IDLE');
            setLastSaved(new Date());
        };
        const handleError = () => setStatus('ERROR');

        window.addEventListener('labcontrol:sync-start', handleStart);
        window.addEventListener('labcontrol:sync-end', handleEnd);
        window.addEventListener('labcontrol:sync-error', handleError);

        return () => {
            window.removeEventListener('labcontrol:sync-start', handleStart);
            window.removeEventListener('labcontrol:sync-end', handleEnd);
            window.removeEventListener('labcontrol:sync-error', handleError);
        };
    }, []);

    if (!ApiClient.isElectron()) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 transition-opacity duration-300 pointer-events-none">
            {status === 'SAVING' && (
                <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold animate-pulse pointer-events-auto">
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    Salvando no Disco...
                </div>
            )}
            {status === 'ERROR' && (
                <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold pointer-events-auto">
                    <span className="material-symbols-outlined text-sm">error</span>
                    Erro ao Salvar
                </div>
            )}
            {status === 'IDLE' && lastSaved && (
                <div className="bg-gray-800/80 text-gray-300 px-3 py-1 rounded-full text-[10px] backdrop-blur-sm opacity-50 hover:opacity-100 transition-opacity pointer-events-auto">
                    Salvo: {lastSaved.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};
