
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { InventoryService } from '../services/InventoryService';
import { InventoryItem } from '../types';
import { useAlert } from '../context/AlertContext';
import { Badge } from './ui/Badge';
import { useScanner } from '../hooks/useScanner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickScanModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addToast } = useAlert();
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [continuousMode, setContinuousMode] = useState(false);
  const [continuousType, setContinuousType] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  
  // Controle de "CoolDown" para evitar leituras duplas do mesmo código
  const lastScanRef = useRef<{code: string, time: number} | null>(null);
  const [scanHistory, setScanHistory] = useState<{name: string, time: string, type: 'IN'|'OUT'}[]>([]);

  const handleScan = useCallback(async (decodedText: string) => {
      // Debounce lógico: Ignora o mesmo código se lido em menos de 2 segundos
      const now = Date.now();
      if (lastScanRef.current && 
          lastScanRef.current.code === decodedText && 
          (now - lastScanRef.current.time < 2000)) {
          return;
      }
      lastScanRef.current = { code: decodedText, time: now };

      try {
          // 1. Tentar encontrar o item
          const item = await InventoryService.findItemByCode(decodedText);
          
          if (item) {
              setScannedItem(item);
              
              if (continuousMode) {
                  // Modo Contínuo: Registra movimento imediato
                  await InventoryService.registerMovement(
                      item, 
                      continuousType,
                      1, 
                      new Date().toISOString(), 
                      `Scan Rápido (${continuousType})`
                  );
                  
                  const typeLabel = continuousType === 'ENTRADA' ? 'Entrada' : 'Saída';
                  const symbol = continuousType === 'ENTRADA' ? '+1' : '-1';

                  addToast(`${typeLabel} Registrada: ${item.name}`, 'success', `${symbol} UN`, 2000);
                  
                  setScanHistory(prev => [
                      { name: item.name, time: new Date().toLocaleTimeString(), type: continuousType === 'SAIDA' ? 'OUT' : 'IN' },
                      ...prev.slice(0, 4) // Mantém apenas os últimos 5
                  ]);
                  
                  // Reset para próxima leitura
                  setTimeout(() => setScannedItem(null), 1500);
              } else {
                  // Modo Normal: Mostra detalhes para ação manual
                  // (Neste caso, não limpamos scannedItem)
              }
          } else {
              addToast('Não encontrado', 'error', `Código: ${decodedText}`);
              if (continuousMode) {
                   setTimeout(() => setScannedItem(null), 1000);
              }
          }
      } catch (e) {
          console.error(e);
          addToast('Erro', 'error', 'Falha ao processar código.');
      }
  }, [continuousMode, addToast]);

  const handleError = useCallback((msg: string) => console.debug("Scan error:", msg), []);

  const { elementId, startScanner, stopScanner, error, isScanning } = useScanner({
      onScan: handleScan,
      onError: handleError,
      aspectRatio: 1.0
  });

  useEffect(() => {
      if (isOpen) {
          const timer = setTimeout(() => startScanner(), 100);
          return () => clearTimeout(timer);
      } else {
          stopScanner();
          setScannedItem(null);
          setScanHistory([]);
      }
  }, [isOpen, startScanner, stopScanner]);

  const handleManualAction = async (type: 'ENTRADA' | 'SAIDA') => {
      if (!scannedItem) return;
      const qty = parseFloat(quantity) || 1;
      
      await InventoryService.registerMovement(
          scannedItem, 
          type, 
          qty, 
          new Date().toISOString(), 
          'Scan Manual'
      );
      
      addToast(`${type === 'ENTRADA' ? 'Entrada' : 'Saída'} Registrada`, 'success');
      setScannedItem(null);
      if (!continuousMode) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideHeader noPadding className="max-w-md bg-black border-none">
        <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark relative min-h-[500px]">
            {/* Header com Toggle */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex flex-col">
                    <h3 className="text-white font-bold text-lg drop-shadow-md">Scanner</h3>
                    <p className="text-white/80 text-xs">{continuousMode ? 'Modo Contínuo (Saída Automática -1)' : 'Modo Manual (Detalhes)'}</p>
                </div>
                <button onClick={onClose} className="text-white bg-white/20 p-2 rounded-full backdrop-blur-sm hover:bg-white/30">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Viewport da Câmera */}
            <div className="w-full h-[350px] bg-black relative overflow-hidden flex flex-col justify-center">
                {error ? (
                    <div className="text-center text-white p-6">
                        <span className="material-symbols-outlined text-4xl mb-2 text-red-500">videocam_off</span>
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <div id={elementId} className="w-full h-full object-cover"></div>
                        {isScanning && (
                             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                 <div className="w-64 h-64 border-2 border-primary/80 rounded-lg relative animate-pulse shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                     <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                 </div>
                             </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Botão de Toggle de Modo */}
            <div className="absolute top-[320px] right-4 z-20 flex flex-col gap-2 items-end">
                {continuousMode && (
                     <div className="flex bg-black/50 backdrop-blur-md rounded-full p-1 border border-white/20 animate-fade-in">
                         <button
                            onClick={() => setContinuousType('ENTRADA')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${continuousType === 'ENTRADA' ? 'bg-green-500 text-white' : 'text-white/70 hover:text-white'}`}
                         >
                             ENTRADA
                         </button>
                         <button
                            onClick={() => setContinuousType('SAIDA')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${continuousType === 'SAIDA' ? 'bg-red-500 text-white' : 'text-white/70 hover:text-white'}`}
                         >
                             SAÍDA
                         </button>
                     </div>
                )}
                <button 
                    onClick={() => setContinuousMode(!continuousMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-lg backdrop-blur-md transition-all ${
                        continuousMode 
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/20 text-white border border-white/30'
                    }`}
                >
                    <span className="material-symbols-outlined text-base">
                        {continuousMode ? 'bolt' : 'touch_app'}
                    </span>
                    {continuousMode ? 'AUTO' : 'MANUAL'}
                </button>
            </div>

            {/* Painel de Ação (Slide Up) */}
            <div className="flex-1 bg-surface-light dark:bg-surface-dark p-4 rounded-t-2xl -mt-4 relative z-10 flex flex-col gap-4">
                {scannedItem ? (
                    <div className="animate-slide-up">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <Badge variant={continuousMode ? 'success' : 'primary'}>{continuousMode ? 'REGISTRADO' : 'DETECTADO'}</Badge>
                                <h4 className="font-bold text-lg text-text-main dark:text-white mt-1 leading-tight">{scannedItem.name}</h4>
                                <p className="text-xs text-text-secondary font-mono">{scannedItem.sapCode} • Lote: {scannedItem.lotNumber}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs uppercase text-text-secondary font-bold">Atual</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">{scannedItem.quantity} <span className="text-sm">{scannedItem.baseUnit}</span></span>
                            </div>
                        </div>

                        {!continuousMode && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <button 
                                        className="size-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xl font-bold"
                                        onClick={() => setQuantity(String(Math.max(1, parseFloat(quantity) - 1)))}
                                    >-</button>
                                    <div className="flex-1">
                                         <input 
                                            type="number" 
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full text-center font-bold text-xl bg-transparent border-b border-border-light dark:border-border-dark py-1 focus:outline-none focus:border-primary"
                                         />
                                    </div>
                                    <button 
                                        className="size-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xl font-bold"
                                        onClick={() => setQuantity(String(parseFloat(quantity) + 1))}
                                    >+</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="danger" onClick={() => handleManualAction('SAIDA')}>
                                        Registrar Saída
                                    </Button>
                                    <Button variant="success" onClick={() => handleManualAction('ENTRADA')}>
                                        Registrar Entrada
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-start pt-2">
                        {scanHistory.length > 0 ? (
                            <div className="w-full">
                                <h5 className="text-xs font-bold text-text-secondary uppercase mb-2">Histórico Recente</h5>
                                <div className="space-y-2">
                                    {scanHistory.map((h, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-background-light dark:bg-slate-800 rounded-lg animate-fade-in">
                                            <span className="truncate flex-1">{h.name}</span>
                                            <span className="text-xs text-text-secondary ml-2">{h.time}</span>
                                            <span className={`text-xs font-bold ml-2 ${h.type === 'OUT' ? 'text-red-500' : 'text-green-500'}`}>
                                                {h.type === 'OUT' ? '-1' : '+1'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-text-secondary opacity-60 mt-4">
                                <span className="material-symbols-outlined text-4xl mb-2">qr_code_scanner</span>
                                <p className="text-sm">Aguardando leitura...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </Modal>
  );
};
