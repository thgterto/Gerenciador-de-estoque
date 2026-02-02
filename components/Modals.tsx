
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, QRCodeDataDTO, CreateItemDTO } from '../types';
import * as ReactQRCode from 'react-qr-code';
const QRCode = (ReactQRCode as any).default || ReactQRCode;
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ItemForm } from './ItemForm';
import { AddItem } from './AddItem';
import { useAlert } from '../context/AlertContext';
import { useScanner } from '../hooks/useScanner';
import { Select } from './ui/Select';

interface ItemModalBaseProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- Componente Auxiliar de Header de Modal ---
const ModalHeader = ({ title, onClose, subtitle }: { title: string, subtitle?: string, onClose: () => void }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark shrink-0 bg-white dark:bg-surface-dark rounded-t-xl z-10">
        <div className="flex flex-col">
            <h3 className="font-bold text-lg text-text-main dark:text-white leading-6">{title}</h3>
            {subtitle && <span className="text-xs text-text-secondary dark:text-slate-400 font-mono mt-0.5">{subtitle}</span>}
        </div>
        <button 
            onClick={onClose} 
            className="text-text-secondary hover:text-text-main dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Fechar"
        >
            <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
    </div>
);

// ============================================================================
// MODAL: SCANNER QR CODE (Genérico)
// ============================================================================

interface QRScannerModalProps extends ItemModalBaseProps {
    onScanSuccess: (decodedText: string) => void;
    title?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess, title = "Escanear Código" }) => {
    const handleScan = (text: string) => {
        onScanSuccess(text);
    };

    const { elementId, startScanner, stopScanner, error, isScanning } = useScanner({
        onScan: handleScan,
        aspectRatio: 1.0
    });

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => startScanner(), 100);
            return () => clearTimeout(timer);
        } else {
            stopScanner();
        }
    }, [isOpen, startScanner, stopScanner]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} hideHeader noPadding className="max-w-md bg-black">
             <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark">
                <ModalHeader title={title} onClose={onClose} />
                <div className="p-6 flex flex-col items-center gap-4">
                    <div className="w-full max-w-xs aspect-square relative bg-black rounded-xl overflow-hidden shadow-inner border-2 border-slate-200 dark:border-slate-700">
                        {error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-surface-light dark:bg-surface-dark">
                                <span className="material-symbols-outlined text-4xl text-red-500 mb-2">videocam_off</span>
                                <p className="text-sm text-red-600 dark:text-red-400 font-bold mb-2">{error}</p>
                                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Recarregar</Button>
                            </div>
                        ) : (
                            <>
                                <div id={elementId} className="w-full h-full object-cover"></div>
                                {isScanning && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="w-48 h-48 border-2 border-white/60 rounded-lg relative animate-pulse">
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary"></div>
                                        </div>
                                    </div>
                                )}
                                {!isScanning && !error && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <p className="text-sm text-center text-text-secondary dark:text-gray-400 max-w-[280px]">
                        Posicione o código QR ou de barras dentro da área demarcada.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

// ============================================================================
// MODAL: GERADOR DE QR CODE
// ============================================================================

interface QRGeneratorModalProps extends ItemModalBaseProps {
    item: Partial<InventoryItem> | null;
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({ isOpen, onClose, item }) => {
    const { addToast } = useAlert();
    
    if (!item) return null;

    const qrData: QRCodeDataDTO = {
        i: item.id || '',
        n: item.name || '',
        s: item.sapCode || '',
        l: item.lotNumber || '',
        e: item.expiryDate || '',
        u: item.baseUnit || ''
    };

    const qrString = JSON.stringify(qrData);

    const handleDownload = () => {
        const svg = document.getElementById("qr-code-svg");
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width + 40;
                canvas.height = img.height + 40;
                if (ctx) {
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 20, 20);
                    
                    const pngFile = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    downloadLink.download = `QR_${item.sapCode || 'Item'}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                }
            };
            
            img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
        } else {
            addToast('Erro', 'error', 'QR Code não renderizado.');
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=600,height=400');
        if (printWindow) {
            const svgHtml = document.getElementById('qr-code-svg')?.outerHTML || '';
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${item.name}</title>
                        <style>
                            @page { size: auto; margin: 0; }
                            body { margin: 0; padding: 10px; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
                            .label { text-align: center; border: 1px dashed #000; padding: 10px; width: 80mm; }
                            .title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
                            .meta { font-size: 10px; margin-bottom: 5px; }
                        </style>
                    </head>
                    <body>
                        <div class="label">
                            <div class="title">${item.name}</div>
                            <div class="meta">Lote: ${item.lotNumber} | Val: ${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</div>
                            ${svgHtml}
                            <div class="meta" style="margin-top: 5px;">${item.id}</div>
                        </div>
                        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} hideHeader noPadding className="max-w-sm">
             <div className="flex flex-col bg-surface-light dark:bg-surface-dark">
                <ModalHeader title="Etiqueta Digital" onClose={onClose} />
                <div className="p-6 flex flex-col items-center gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
                         <QRCode id="qr-code-svg" value={qrString} size={180} level="M" fgColor="#000000" />
                         <p className="text-[10px] text-gray-500 mt-2 font-mono">{item.id || 'NOVO'}</p>
                    </div>
                    <div className="text-center space-y-1">
                        <h4 className="font-bold text-text-main dark:text-white leading-tight">{item.name}</h4>
                        <p className="text-xs text-text-secondary dark:text-gray-400 font-mono">
                            Lote: {item.lotNumber}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button variant="white" onClick={handleDownload} icon="download">Salvar</Button>
                        <Button variant="primary" onClick={handlePrint} icon="print">Imprimir</Button>
                    </div>
                </div>
             </div>
        </Modal>
    );
};

// ============================================================================
// MODAL: ADICIONAR ITEM (Wrapper)
// ============================================================================

export const AddItemModal: React.FC<ItemModalBaseProps & { initialData?: Partial<CreateItemDTO> }> = ({ isOpen, onClose, initialData }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} hideHeader noPadding className="max-w-4xl h-[90vh]">
            <div className="h-full flex flex-col bg-surface-light dark:bg-surface-dark">
                <ModalHeader 
                    title={initialData ? 'Clonar Item' : 'Cadastrar Novo Item'} 
                    subtitle={initialData ? 'Crie um novo lote a partir de um item existente' : 'Preencha os dados do novo material'}
                    onClose={onClose} 
                />
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <AddItem onCancel={onClose} initialData={initialData} />
                </div>
            </div>
        </Modal>
    );
};

// ============================================================================
// MODAL: EDITAR ITEM
// ============================================================================

interface EditModalProps extends ItemModalBaseProps {
  item: InventoryItem | null;
  onSave: (updatedItem: InventoryItem) => Promise<boolean>;
  onViewBatchHistory?: (batchId: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, item, onSave, onViewBatchHistory }) => {
  const [editedItem, setEditedItem] = useState<InventoryItem | null>(item);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanField, setActiveScanField] = useState<keyof CreateItemDTO | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const { addToast } = useAlert();

  useEffect(() => { setEditedItem(item); }, [item, isOpen]);

  const handleScanSuccess = (decodedText: string) => {
      setIsScannerOpen(false);
      if (editedItem && activeScanField) {
          let val = decodedText;
          try {
              const obj = JSON.parse(decodedText);
              if (activeScanField === 'sapCode' && obj.s) val = obj.s;
              if (activeScanField === 'lotNumber' && obj.l) val = obj.l;
          } catch(e) {}
          setEditedItem({ ...editedItem, [activeScanField]: val });
          addToast('Scan Sucesso', 'success', `Campo atualizado.`);
      }
  };

  const handleFormSubmit = async (data: Partial<InventoryItem>) => {
      if (!editedItem) return;
      const success = await onSave({ ...editedItem, ...data });
      if (success) onClose();
  };

  if (!editedItem) return null;

  return (
    <>
        <Modal isOpen={isOpen} onClose={onClose} hideHeader noPadding className="max-w-4xl h-[90vh]">
            <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark">
                <ModalHeader title="Editar Item" subtitle={editedItem.id} onClose={onClose} />
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <ItemForm 
                        initialData={editedItem} 
                        onSubmit={handleFormSubmit} 
                        onCancel={onClose}
                        submitLabel="Salvar Alterações"
                        onViewBatchHistory={onViewBatchHistory}
                        onScan={(field) => { setActiveScanField(field); setIsScannerOpen(true); }}
                        onGenerateQR={() => setShowQRModal(true)}
                    />
                </div>
            </div>
        </Modal>
        
        <QRScannerModal 
            isOpen={isScannerOpen} 
            onClose={() => setIsScannerOpen(false)} 
            onScanSuccess={handleScanSuccess} 
        />
        <QRGeneratorModal
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            item={editedItem}
        />
    </>
  );
};

// ============================================================================
// MODAL: MOVIMENTAÇÃO
// ============================================================================

interface MovementModalProps extends ItemModalBaseProps {
    item: InventoryItem | null;
    onConfirm: (item: InventoryItem, type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA', quantity: number, date: string, obs: string) => Promise<boolean>;
}

export const MovementModal: React.FC<MovementModalProps> = ({ isOpen, onClose, item, onConfirm }) => {
    const [type, setType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('SAIDA');
    const [quantity, setQuantity] = useState<number>(1);
    const [observation, setObservation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useAlert();

    useEffect(() => {
        if(isOpen) {
            setQuantity(1);
            setObservation('');
            setType('SAIDA');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;

        if (quantity <= 0) { addToast("Qtd inválida", "warning"); return; }
        if (type === 'SAIDA' && quantity > item.quantity) {
             addToast("Saldo Insuficiente", "error", `Max: ${item.quantity}`);
             return;
        }

        setIsSubmitting(true);
        const success = await onConfirm(item, type, quantity, new Date().toISOString(), observation);
        setIsSubmitting(false);
        if (success) onClose();
    };

    if (!item) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} hideHeader noPadding className="max-w-md">
            <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark">
                <ModalHeader title="Registrar Movimento" onClose={onClose} />
                <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                    <div className="p-6 space-y-6">
                        <div className="bg-background-light dark:bg-slate-800 p-4 rounded-xl border border-border-light dark:border-border-dark flex items-start gap-3">
                             <div className="p-2 rounded-lg bg-white dark:bg-slate-700 text-primary shadow-sm">
                                 <span className="material-symbols-outlined">inventory_2</span>
                             </div>
                             <div className="flex-1 min-w-0">
                                 <h4 className="font-bold text-sm text-text-main dark:text-white truncate">{item.name}</h4>
                                 <div className="flex items-center justify-between mt-1">
                                     <span className="text-xs font-mono text-text-secondary dark:text-gray-400">{item.lotNumber}</span>
                                     <span className="text-xs font-bold text-text-main dark:text-white">Saldo: {item.quantity} {item.baseUnit}</span>
                                 </div>
                             </div>
                        </div>

                        <div className="space-y-4">
                            <Select 
                                label="Tipo de Operação" 
                                value={type} 
                                onChange={e => setType(e.target.value as any)}
                                options={[
                                    {label: 'Saída / Consumo', value: 'SAIDA'},
                                    {label: 'Entrada / Devolução', value: 'ENTRADA'},
                                    {label: 'Ajuste de Inventário', value: 'AJUSTE'}
                                ]}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Quantidade" 
                                    type="number" 
                                    step="any" 
                                    min="0.0001"
                                value={String(quantity)}
                                    onChange={e => setQuantity(parseFloat(e.target.value))} 
                                    required 
                                    autoFocus
                                    className="font-bold text-lg"
                                />
                                <div className="flex items-end pb-3">
                                    <span className="text-sm font-medium text-text-secondary dark:text-gray-400">{item.baseUnit}</span>
                                </div>
                            </div>
                            
                            <Input 
                                label="Justificativa" 
                                value={observation} 
                                onChange={e => setObservation(e.target.value)} 
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-xl">
                        <Button variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>Cancelar</Button>
                        <Button 
                            variant={type === 'SAIDA' ? 'danger' : type === 'ENTRADA' ? 'success' : 'warning'} 
                            type="submit" 
                            isLoading={isSubmitting}
                            icon="save"
                        >
                            Confirmar
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// ============================================================================
// MODAL: SOLICITAÇÃO (Compras)
// ============================================================================

interface RequestModalProps extends ItemModalBaseProps {
    onConfirm: (item: InventoryItem, qty: number, reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL') => void;
    items?: InventoryItem[];
}

export const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose, onConfirm, items = [] }) => {
    const [selectedId, setSelectedId] = useState('');
    const [qty, setQty] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if(isOpen) { setSelectedId(''); setQty(1); setSearchTerm(''); }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const item = items.find(i => i.id === selectedId);
        if (item) {
            onConfirm(item, qty, 'MANUAL');
            onClose();
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items.slice(0, 50);
        const lower = searchTerm.toLowerCase();
        return items.filter(i => i.name.toLowerCase().includes(lower) || i.sapCode.includes(searchTerm)).slice(0, 20);
    }, [items, searchTerm]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} hideHeader noPadding className="max-w-md">
            <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark">
                <ModalHeader title="Solicitar Compra" onClose={onClose} />
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 p-6 gap-5">
                    <Input 
                        label="Buscar Produto" 
                        placeholder="Digite para filtrar..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        icon="search"
                    />
                    
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block">Selecione o Item</label>
                        <select 
                            className="w-full h-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 text-sm px-3 focus:ring-primary focus:border-primary"
                            value={selectedId}
                            onChange={e => setSelectedId(e.target.value)}
                            required
                            size={5}
                        >
                            {filteredItems.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.quantity} {item.baseUnit})
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input 
                        label="Quantidade Necessária" 
                        type="number" 
                        min="1" 
                        value={String(qty)}
                        onChange={e => setQty(parseInt(e.target.value))} 
                        required 
                    />

                    <div className="mt-auto pt-4 flex justify-end gap-2">
                        <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
                        <Button variant="primary" type="submit" disabled={!selectedId} icon="add_shopping_cart">Adicionar</Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
