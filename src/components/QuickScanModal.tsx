
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OrbitalModal } from './ui/orbital/OrbitalModal';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import { InventoryService } from '../services/InventoryService';
import { InventoryItem } from '../types';
import { useAlert } from '../context/AlertContext';
import { useScanner } from '../hooks/useScanner';
import { QrCode, X, Zap, Activity } from 'lucide-react';

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
  
  const lastScanRef = useRef<{code: string, time: number} | null>(null);
  const [scanHistory, setScanHistory] = useState<{name: string, time: string, type: 'IN'|'OUT'}[]>([]);

  const handleScan = useCallback(async (decodedText: string) => {
      const now = Date.now();
      if (lastScanRef.current && 
          lastScanRef.current.code === decodedText && 
          (now - lastScanRef.current.time < 2000)) {
          return;
      }
      lastScanRef.current = { code: decodedText, time: now };

      try {
          const item = await InventoryService.findItemByCode(decodedText);
          
          if (item) {
              setScannedItem(item);
              
              if (continuousMode) {
                  await InventoryService.registerMovement(
                      item, 
                      continuousType,
                      1, 
                      new Date().toISOString(), 
                      `Quick Scan (${continuousType})`
                  );
                  
                  const typeLabel = continuousType === 'ENTRADA' ? 'IN' : 'OUT';
                  const symbol = continuousType === 'ENTRADA' ? '+1' : '-1';

                  addToast(`${typeLabel}: ${item.name}`, 'success', `${symbol} UN`, 2000);
                  
                  setScanHistory(prev => [
                      { name: item.name, time: new Date().toLocaleTimeString(), type: continuousType === 'SAIDA' ? 'OUT' : 'IN' },
                      ...prev.slice(0, 4)
                  ]);
                  
                  setTimeout(() => setScannedItem(null), 1500);
              }
          } else {
              addToast('Not Found', 'error', `Code: ${decodedText}`);
              if (continuousMode) {
                   setTimeout(() => setScannedItem(null), 1000);
              }
          }
      } catch (e) {
          console.error(e);
          addToast('Scan Error', 'error', 'Processing failed');
      }
  }, [continuousMode, continuousType, addToast]);

  const handleError = useCallback((msg: string) => console.debug("Scan error:", msg), []);

  const { elementId, startScanner, stopScanner, error, isScanning } = useScanner({
      onScan: handleScan,
      onError: handleError,
      aspectRatio: 1.0
  });

  useEffect(() => {
      if (isOpen) {
          const timer = setTimeout(() => {
              setScannedItem(null);
              setScanHistory([]);
              startScanner();
          }, 100);
          return () => clearTimeout(timer);
      } else {
          stopScanner();
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
          'Manual Scan'
      );
      
      addToast(`${type === 'ENTRADA' ? 'IN' : 'OUT'} REGISTERED`, 'success');
      setScannedItem(null);
      if (!continuousMode) onClose();
  };

  return (
    <OrbitalModal isOpen={isOpen} onClose={onClose} title="SCANNER" className="max-w-md bg-black border-orbital-border" hideHeader noPadding>
        <div className="flex flex-col h-full bg-orbital-surface relative min-h-[500px]">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
                <div className="flex flex-col pointer-events-auto">
                    <h3 className="text-orbital-accent font-bold text-lg font-display tracking-widest uppercase flex items-center gap-2">
                        <QrCode size={18} /> SCANNER
                    </h3>
                    <p className="text-orbital-subtext text-[10px] font-mono uppercase mt-1">
                        {continuousMode ? 'AUTO MODE ACTIVE (-1 OUT)' : 'MANUAL CONFIRMATION MODE'}
                    </p>
                </div>
                <button aria-label="Close scanner" onClick={onClose} className="pointer-events-auto text-orbital-text hover:text-orbital-accent bg-black/50 p-2 border border-orbital-border hover:border-orbital-accent transition-all">
                    <X size={20} />
                </button>
            </div>

            {/* Camera Viewport */}
            <div className="w-full h-[350px] bg-black relative overflow-hidden flex flex-col justify-center border-b border-orbital-border">
                {error ? (
                    <div className="text-center text-orbital-danger p-6 font-mono">
                        <X size={48} className="mx-auto mb-4" />
                        <p>CAMERA ACCESS DENIED</p>
                    </div>
                ) : (
                    <>
                        <div id={elementId} className="w-full h-full object-cover opacity-80"></div>
                        {isScanning && (
                             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                 <div className="w-64 h-64 border border-orbital-accent/50 relative shadow-[0_0_50px_rgba(0,243,255,0.2)]">
                                     {/* Crosshairs */}
                                     <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orbital-accent"></div>
                                     <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orbital-accent"></div>
                                     <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orbital-accent"></div>
                                     <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orbital-accent"></div>

                                     {/* Scanning Line */}
                                     <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-orbital-danger shadow-[0_0_8px_rgba(255,50,50,0.8)] animate-pulse"></div>
                                 </div>
                             </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Mode Toggles */}
            <div className="absolute top-[310px] right-4 z-20 flex flex-col gap-2 items-end">
                {continuousMode && (
                     <div className="flex bg-black/80 backdrop-blur-md border border-orbital-border p-1 animate-in slide-in-from-right-5">
                         <button
                            onClick={() => setContinuousType('ENTRADA')}
                            className={`px-3 py-1 text-[10px] font-bold font-mono transition-colors ${continuousType === 'ENTRADA' ? 'bg-orbital-success text-black' : 'text-orbital-subtext hover:text-white'}`}
                         >
                             IN
                         </button>
                         <button
                            onClick={() => setContinuousType('SAIDA')}
                            className={`px-3 py-1 text-[10px] font-bold font-mono transition-colors ${continuousType === 'SAIDA' ? 'bg-orbital-danger text-black' : 'text-orbital-subtext hover:text-white'}`}
                         >
                             OUT
                         </button>
                     </div>
                )}
                <button 
                    onClick={() => setContinuousMode(!continuousMode)}
                    className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold font-display uppercase tracking-wider border transition-all shadow-lg backdrop-blur-md ${
                        continuousMode 
                        ? 'bg-orbital-warning/10 border-orbital-warning text-orbital-warning shadow-[0_0_15px_rgba(255,165,0,0.3)]'
                        : 'bg-black/50 border-orbital-border text-orbital-subtext hover:border-orbital-accent hover:text-orbital-accent'
                    }`}
                >
                    {continuousMode ? <Zap size={14} fill="currentColor" /> : <Activity size={14} />}
                    {continuousMode ? 'AUTO-SCAN' : 'MANUAL'}
                </button>
            </div>

            {/* Action Panel */}
            <div className="flex-1 bg-orbital-bg p-6 border-t border-orbital-accent/20 relative z-10 flex flex-col gap-4">
                {scannedItem ? (
                    <div className="animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <OrbitalBadge variant={continuousMode ? 'success' : 'primary'} label={continuousMode ? 'LOGGED' : 'DETECTED'} />
                                <h4 className="font-bold text-lg text-orbital-text mt-2 font-display uppercase tracking-wide">{scannedItem.name}</h4>
                                <p className="text-xs text-orbital-subtext font-mono">SAP: {scannedItem.sapCode} | LOT: {scannedItem.lotNumber}</p>
                            </div>
                            <div className="text-right border border-orbital-border p-2 bg-orbital-surface">
                                <span className="block text-[10px] uppercase text-orbital-subtext font-bold mb-1">Current Stock</span>
                                <span className="text-xl font-bold text-orbital-text font-mono">{scannedItem.quantity} <span className="text-sm">{scannedItem.baseUnit}</span></span>
                            </div>
                        </div>

                        {!continuousMode && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <button 
                                        className="size-10 border border-orbital-border hover:border-orbital-accent hover:bg-orbital-accent/10 flex items-center justify-center text-xl font-bold text-orbital-text transition-colors" aria-label="Decrease quantity"
                                        onClick={() => setQuantity(String(Math.max(1, parseFloat(quantity) - 1)))}
                                    >-</button>
                                    <div className="flex-1">
                                         <input 
                                            type="number" 
                                            value={quantity}
                                            aria-label="Quantity to register"
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full text-center font-bold text-2xl bg-transparent border-b border-orbital-border text-orbital-accent py-1 focus:outline-none focus:border-orbital-accent font-mono"
                                         />
                                    </div>
                                    <button 
                                        className="size-10 border border-orbital-border hover:border-orbital-accent hover:bg-orbital-accent/10 flex items-center justify-center text-xl font-bold text-orbital-text transition-colors" aria-label="Increase quantity"
                                        onClick={() => setQuantity(String(parseFloat(quantity) + 1))}
                                    >+</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <OrbitalButton variant="danger" onClick={() => handleManualAction('SAIDA')}>
                                        REGISTER OUT
                                    </OrbitalButton>
                                    <OrbitalButton variant="success" onClick={() => handleManualAction('ENTRADA')}>
                                        REGISTER IN
                                    </OrbitalButton>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-start pt-2">
                        {scanHistory.length > 0 ? (
                            <div className="w-full">
                                <h5 className="text-[10px] font-bold text-orbital-subtext uppercase tracking-widest mb-3 border-b border-orbital-border pb-1">Recent Activity</h5>
                                <div className="space-y-2">
                                    {scanHistory.map((h, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-orbital-surface border border-orbital-border hover:border-orbital-accent/30 transition-colors animate-in fade-in">
                                            <span className="truncate flex-1 font-mono text-xs text-orbital-text">{h.name}</span>
                                            <span className="text-[10px] text-orbital-subtext ml-2 font-mono">{h.time}</span>
                                            <span className={`text-xs font-bold ml-2 font-mono ${h.type === 'OUT' ? 'text-orbital-danger' : 'text-orbital-success'}`}>
                                                {h.type === 'OUT' ? '-1' : '+1'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-orbital-subtext opacity-50 mt-4 animate-pulse">
                                <QrCode size={48} strokeWidth={1} className="mx-auto mb-2" />
                                <p className="text-xs font-mono uppercase">Awaiting Target...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </OrbitalModal>
  );
};
