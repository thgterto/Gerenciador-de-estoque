import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem, QRCodeDataDTO, CreateItemDTO } from '../types';
import QRCode from 'react-qr-code';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ItemForm } from './ItemForm';
import { AddItem } from './AddItem';
import { InventoryService } from '../services/InventoryService';
import { useAlert } from '../context/AlertContext';
import { useScanner } from '../hooks/useScanner';
import { Select } from './ui/Select';

/**
 * Interface comum para modais que manipulam dados de itens.
 */
interface ItemModalBaseProps {
    isOpen: boolean;
    onClose: () => void;
}

// ============================================================================
// MODAL: SCANNER QR CODE (Genérico)
// ============================================================================

interface QRScannerModalProps extends ItemModalBaseProps {
    onScanSuccess: (decodedText: string) => void;
    title?: string;
}

/**
 * Modal wrapper para o Scanner de QR Code.
 * Usa o hook `useScanner` para gerenciar a câmera.
 */
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
        <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
            <div className="flex flex-col items-center gap-4 p-2">
                <div className="w-full relative bg-black rounded-xl overflow-hidden shadow-inner aspect-square border-2 border-border-light dark:border-border-dark">
                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                            <span className="material-symbols-outlined text-4xl text-red-500 mb-2">videocam_off</span>
                            <p className="text-sm text-red-400 font-bold">{error}</p>
                            <Button variant="white" size="sm" className="mt-4" onClick={() => window.location.reload()}>Recarregar</Button>
                        </div>
                    ) : (
                        <>
                            <div id={elementId} className="w-full h-full object-cover"></div>
                            {isScanning && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
                                    </div>
                                </div>
                            )}
                            {!isScanning && !error && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-white/50 animate-spin">progress_activity</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <p className="text-sm text-center text-text-secondary dark:text-gray-400">
                    Aponte para o código de barras ou QR Code do item.
                </p>
                <Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
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

/**
 * Modal para visualizar, imprimir e baixar o QR Code de um item.
 */
export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({ isOpen, onClose, item }) => {
    const { addToast } = useAlert();
    const qrRef = useRef<HTMLDivElement>(null);

    if (!item) return null;

    // DTO minificado
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
                    downloadLink.download = `QR_${item.sapCode || item.name}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                }
            };
            
            img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
        } else {
            addToast('Erro', 'error', 'Elemento QR Code não encontrado.');
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=600,height=400');
        if (printWindow && qrRef.current) {
            const svgHtml = document.getElementById('qr-code-svg')?.outerHTML || '';
            
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Etiqueta - ${item.name}</title>
                        <style>
                            @page { size: auto; margin: 0mm; }
                            body { margin: 0; padding: 10px; font-family: 'Arial', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
                            .label-page { width: 80mm; padding: 5px; text-align: center; border: 1px dashed #ccc; }
                            .header { font-size: 12px; font-weight: bold; margin-bottom: 5px; line-height: 1.1; text-transform: uppercase; }
                            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; text-align: left; margin-bottom: 5px; }
                            .qr-container { display: flex; justify-content: center; margin: 5px 0; }
                            .footer { font-size: 8px; margin-top: 5px; border-top: 1px solid #000; padding-top: 2px; }
                        </style>
                    </head>
                    <body>
                        <div class="label-page">
                            <div class="header">${item.name}</div>
                            <div class="meta-grid">
                                <div><strong>SAP:</strong> ${item.sapCode || '-'}</div>
                                <div><strong>Lote:</strong> ${item.lotNumber}</div>
                                <div><strong>Val.:</strong> ${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                                <div><strong>Qtd:</strong> ${item.quantity} ${item.baseUnit}</div>
                            </div>
                            <div class="qr-container">${svgHtml}</div>
                            <div class="footer">ID: ${item.id}</div>
                        </div>
                        <script>
                            setTimeout(() => { window.print(); window.close(); }, 500);
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Etiqueta Digital" className="max-w-sm">
            <div className="flex flex-col items-center gap-6" ref={qrRef}>
                <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 flex flex-col items-center w-full relative group">
                     <QRCode id="qr-code-svg" value={qrString} size={160} level="M" fgColor="#000000" />
                     <p className="text-[10px] text-gray-400 mt-2 font-mono text-center break-all px-4">{item.id || 'NOVO'}</p>
                </div>
                <div className="text-center w-full space-y-2">
                    <h3 className="font-bold text-text-main dark:text-white text-base leading-tight px-2">{item.name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary dark:text-gray-400 mt-2">
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-border-light dark:border-gray-700">
                            <span className="block text-[10px] font-bold uppercase">Lote</span>{item.lotNumber}
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-border-light dark:border-gray-700">
                             <span className="block text-[10px] font-bold uppercase">Validade</span>
                             {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                    <Button variant="white" onClick={handleDownload} icon="download">Baixar PNG</Button>
                    <Button variant="primary" onClick={handlePrint} icon="print">Imprimir</Button>
                </div>
            </div>
        </Modal>
    );
};

// ============================================================================
// MODAL: ADICIONAR ITEM
// ============================================================================

interface AddItemModalProps extends ItemModalBaseProps {}

export const AddItemModal: React.FC<AddItemModalProps & { initialData?: Partial<CreateItemDTO> }> = ({ isOpen, onClose, initialData }) => {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Novo Item" 
            className="max-w-4xl h-[90vh]" 
            hideHeader
            noPadding={true}
        >
            <div className="h-full flex flex-col bg-white dark:bg-surface-dark">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark shrink-0 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-lg text-text-main dark:text-white leading-6">
                            {initialData ? 'Adicionar Lote (Clonar Item)' : 'Cadastrar Novo Item'}
                        </h3>
                        {initialData && <span className="text-xs text-text-secondary dark:text-slate-400">Dados copiados. Informe o novo lote.</span>}
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-text-secondary hover:text-text-main dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        aria-label="Fechar modal"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-surface-light dark:bg-surface-dark">
                    <AddItem 
                        onCancel={onClose} 
                        initialData={initialData} 
                    />
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
  onSave: (updatedItem: InventoryItem) => void;
  onViewBatchHistory?: (batchId: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, item, onSave, onViewBatchHistory }) => {
  const [editedItem, setEditedItem] = useState<InventoryItem | null>(item);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanField, setActiveScanField] = useState<keyof CreateItemDTO | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const { addToast } = useAlert();

  useEffect(() => {
      setEditedItem(item);
  }, [item, isOpen]);

  const handleScanRequest = (field: keyof CreateItemDTO) => {
      setActiveScanField(field);
      setIsScannerOpen(true);
  };

  const handleScanSuccess = (decodedText: string) => {
      setIsScannerOpen(false);
      if (editedItem && activeScanField) {
          // Extrai dado se for JSON, senão usa texto puro
          let val = decodedText;
          try {
              const obj = JSON.parse(decodedText);
              // Lógica de mapeamento inteligente se o QR for um objeto completo
              if (activeScanField === 'sapCode' && obj.s) val = obj.s;
              if (activeScanField === 'lotNumber' && obj.l) val = obj.l;
          } catch(e) {}
          
          setEditedItem({ ...editedItem, [activeScanField]: val });
          addToast('Scan Sucesso', 'success', `Campo atualizado: ${val}`);
      }
      setActiveScanField(null);
  };

  if (!editedItem) return null;

  return (
    <>
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Editar Cadastro" 
            className="max-w-4xl h-[90vh]" 
            hideHeader
            noPadding={true}
        >
            <div className="flex flex-col h-full bg-white dark:bg-surface-dark">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-6">Editar Item</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{editedItem.id}</span>
                </div>
                <button 
                    onClick={onClose} 
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    aria-label="Fechar"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <ItemForm 
                        initialData={editedItem} 
                        onSubmit={async (data) => { onSave({ ...editedItem, ...data }); onClose(); }} 
                        onCancel={onClose}
                        submitLabel="Salvar Alterações"
                        onViewBatchHistory={onViewBatchHistory}
                        onScan={handleScanRequest}
                        onGenerateQR={() => setShowQRModal(true)}
                    />
                </div>
            </div>
        </Modal>
        
        <QRScannerModal 
            isOpen={isScannerOpen} 
            onClose={() => setIsScannerOpen(false)} 
            onScanSuccess={handleScanSuccess} 
            title={`Escanear para ${activeScanField === 'sapCode' ? 'Código SAP' : 'Lote'}`}
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
// MODAL: MOVIMENTAÇÃO (Entrada/Saída/Ajuste)
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
        setIsSubmitting(true);
        await onConfirm(item, type, quantity, new Date().toISOString(), observation);
        setIsSubmitting(false);
        onClose();
    };

    if (!item) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Movimentação">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-border-light dark:border-border-dark flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-text-main dark:text-white">{item.name}</p>
                        <p className="text-xs text-text-secondary">Lote: {item.lotNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-text-secondary">Saldo Atual</p>
                        <p className="text-sm font-mono font-bold">{item.quantity} {item.baseUnit}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select label="Tipo" value={type} onChange={e => setType(e.target.value as any)}>
                        <option value="SAIDA">Saída</option>
                        <option value="ENTRADA">Entrada</option>
                        <option value="AJUSTE">Ajuste (Correção)</option>
                    </Select>
                    <Input 
                        label="Quantidade" 
                        type="number" 
                        step="any" 
                        min="0.0001"
                        value={quantity} 
                        onChange={e => setQuantity(parseFloat(e.target.value))} 
                        required 
                    />
                </div>
                
                <Input 
                    label="Observação / Justificativa" 
                    value={observation} 
                    onChange={e => setObservation(e.target.value)} 
                    placeholder="Opcional"
                />

                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
                    <Button variant="primary" type="submit" isLoading={isSubmitting}>Confirmar</Button>
                </div>
            </form>
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
        if(isOpen) {
            setSelectedId('');
            setQty(1);
            setSearchTerm('');
        }
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
        <Modal isOpen={isOpen} onClose={onClose} title="Solicitar Compra (Manual)">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input 
                    label="Buscar Item" 
                    placeholder="Nome ou Código SAP..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    icon="search"
                />
                
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Selecione o Item</label>
                    <select 
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm px-3 focus:ring-primary focus:border-primary"
                        value={selectedId}
                        onChange={e => setSelectedId(e.target.value)}
                        required
                        size={5}
                    >
                        {filteredItems.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} (Saldo: {item.quantity} {item.baseUnit})
                            </option>
                        ))}
                        {filteredItems.length === 0 && <option disabled>Nenhum item encontrado</option>}
                    </select>
                </div>

                <Input 
                    label="Quantidade a Comprar" 
                    type="number" 
                    min="1" 
                    value={qty} 
                    onChange={e => setQty(parseInt(e.target.value))} 
                    required 
                />

                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
                    <Button variant="primary" type="submit" disabled={!selectedId}>Adicionar à Lista</Button>
                </div>
            </form>
        </Modal>
    );
};