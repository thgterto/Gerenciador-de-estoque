
import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { InventoryService } from '../services/InventoryService';
import { InventoryItem } from '../types';
import { useAlert } from '../context/AlertContext';
import { Badge } from './ui/Badge';
import { useScanner } from '../hooks/useScanner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de escaneamento rápido (Fullscreen mobile-first).
 * Permite entrada e saída rápida de itens diretamente pela câmera.
 */
export const QuickScanModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addToast } = useAlert();
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  // Histórico local de escaneamento para feedback imediato
  const [scanHistory, setScanHistory] = useState<{name: string, time: string, type: 'IN'|'OUT'}[]>([]);

  const handleScan = async (decodedText: string) => {
      // Se já estiver processando ou pausado (ex: item modal aberto), ignora
      if (isPaused || isLoading) return;

      setIsPaused(true); // Pausa a lógica de scan enquanto processa

      let codeToSearch = decodedText;
      try {
          const data = JSON.parse(decodedText);
          if (data.i) codeToSearch = data.i; 
          else if (data.s) codeToSearch = data.s; 
      } catch (e) {
          // Não é JSON, assume código bruto
      }

      const item = await InventoryService.findItemByCode(codeToSearch);
      
      if (item) {
          setScannedItem(item);
          // O scanner continua "ligado" no background, mas a UI cobre ou ignoramos inputs
      } else {
          addToast('Não Encontrado', 'warning', `Item não localizado: ${decodedText}`);
          setTimeout(() => setIsPaused(false), 1500); // Resume após delay curto
      }
  };

  const { elementId, startScanner, stopScanner, error, isScanning } = useScanner({
      onScan: handleScan,
      aspectRatio: 1.777 // Formato mais vertical para mobile
  });

  // Controle de ciclo de vida do scanner baseado na visibilidade do modal
  useEffect(() => {
      if (isOpen) {
          const timer = setTimeout(() => startScanner(), 100);
          return () => clearTimeout(timer);
      } else {
          stopScanner();
          setScannedItem(null);
          setQuantity('1');
          setIsPaused(false);
      }
  }, [isOpen, startScanner, stopScanner]);

  const resumeScanning = () => {
      setScannedItem(null);
      setQuantity('1');
      setIsPaused(false);
  };

  const handleTransaction = async (type: 'ENTRADA' | 'SAIDA') => {
      if (!scannedItem) return;
      
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
          addToast('Quantidade Inválida', 'error');
          return;
      }

      setIsLoading(true);
      try {
          await InventoryService.registerMovement(
              scannedItem, 
              type, 
              qty, 
              new Date().toISOString(), 
              'Inventário Rápido (Scanner)'
          );
          
          setScanHistory(prev => [{
              name: scannedItem.name,
              time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
              type: (type === 'ENTRADA' ? 'IN' : 'OUT') as 'IN' | 'OUT'
          }, ...prev].slice(0, 5));

          addToast(type === 'ENTRADA' ? 'Adicionado' : 'Removido', 'success');
          resumeScanning();
      } catch (e) {
          addToast('Erro', 'error', (e as Error).message);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Inventário Rápido" 
        className="max-w-md h-[95vh] flex flex-col" 
        hideHeader
        noPadding={true}
    >
        <div className="flex flex-col h-full bg-black text-white relative">
            
            {/* Header Overlay Transparente */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
                        Scanner
                    </h2>
                    <p className="text-xs text-gray-300">Aponte para código de barras ou QR</p>
                </div>
                <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-white">close</span>
                </button>
            </div>

            {/* Área da Câmera */}
            <div className="flex-1 bg-black relative overflow-hidden flex flex-col justify-center">
                {error ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center z-10 relative">
                        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">videocam_off</span>
                        <p className="text-red-400 font-bold">{error}</p>
                        <p className="text-gray-400 text-sm mt-2">Verifique as permissões do navegador.</p>
                        <Button variant="white" size="sm" className="mt-4" onClick={() => window.location.reload()}>Recarregar</Button>
                    </div>
                ) : (
                    <div id={elementId} className="w-full h-full object-cover"></div>
                )}
                
                {/* Mira Visual */}
                {!error && !scannedItem && isScanning && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                        <div className="w-64 h-64 border-2 border-white/30 rounded-lg relative animate-pulse">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                        </div>
                    </div>
                )}

                {(isPaused || isLoading) && !scannedItem && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                )}
            </div>

            {/* Bottom Sheet / Painel de Ação (Aparece ao escanear) */}
            <div className={`
                bg-surface-light dark:bg-surface-dark rounded-t-2xl p-5 transition-transform duration-300 ease-in-out z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]
                ${scannedItem ? 'translate-y-0' : 'translate-y-full absolute bottom-0 w-full'}
            `}>
                {scannedItem && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start border-b border-border-light dark:border-border-dark pb-3">
                            <div className="min-w-0 pr-2">
                                <h3 className="font-bold text-lg text-text-main dark:text-white truncate leading-tight">
                                    {scannedItem.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="neutral" className="font-mono text-xs">{scannedItem.lotNumber}</Badge>
                                    <span className="text-xs text-text-secondary dark:text-gray-400">
                                        Saldo: <strong className="text-text-main dark:text-white">{scannedItem.quantity} {scannedItem.baseUnit}</strong>
                                    </span>
                                </div>
                            </div>
                            <button onClick={resumeScanning} className="text-text-secondary hover:text-text-main dark:text-gray-400 p-1">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-24">
                                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Qtd</label>
                                <Input 
                                    type="number" 
                                    value={quantity} 
                                    onChange={e => setQuantity(e.target.value)} 
                                    className="text-center font-bold text-lg h-12"
                                    autoFocus
                                />
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <Button 
                                    variant="danger" 
                                    onClick={() => handleTransaction('SAIDA')} 
                                    isLoading={isLoading}
                                    className="h-12 flex-col gap-0 leading-none"
                                >
                                    <span className="material-symbols-outlined mb-0.5">remove</span>
                                    Saída
                                </Button>
                                <Button 
                                    variant="success" 
                                    onClick={() => handleTransaction('ENTRADA')} 
                                    isLoading={isLoading}
                                    className="h-12 flex-col gap-0 leading-none"
                                >
                                    <span className="material-symbols-outlined mb-0.5">add</span>
                                    Entrada
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Histórico Recente (Overlay) - Aparece apenas se nenhum item estiver selecionado */}
            {!scannedItem && scanHistory.length > 0 && !error && (
                <div className="absolute bottom-6 left-4 right-4 z-20">
                     <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Últimas Ações</p>
                        <div className="space-y-1">
                            {scanHistory.map((h, i) => (
                                <div key={i} className="flex justify-between items-center text-xs text-white/90 p-1.5 rounded hover:bg-white/5">
                                    <span className="truncate flex-1 pr-2">{h.name}</span>
                                    <span className={`flex items-center gap-1 font-bold ${h.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                                        {h.type === 'IN' ? 'ENT' : 'SAÍ'} 
                                        <span className="text-[10px] opacity-60 font-normal text-gray-400">{h.time}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            )}
        </div>
    </Modal>
  );
};
