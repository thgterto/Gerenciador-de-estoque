import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, QRCodeDataDTO, CreateItemDTO } from '../types';
import * as ReactQRCode from 'react-qr-code';
const QRCode = (ReactQRCode as any).default || ReactQRCode;
import { escapeHtml } from '../utils/stringUtils';

import { ItemForm } from './ItemForm';
import { AddItem } from './AddItem';
import { useAlert } from '../context/AlertContext';
import { useScanner } from '../hooks/useScanner';
import { OrbitalModal } from './ui/orbital/OrbitalModal';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { OrbitalSelect } from './ui/orbital/OrbitalSelect';
import {
    Download,
    Printer,
    VideoOff,
    Loader2,
    Save,
    Package,
    Search,
    ShoppingCart
} from 'lucide-react';

interface ItemModalBaseProps {
    isOpen: boolean;
    onClose: () => void;
}

// ============================================================================
// MODAL: SCANNER QR CODE
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
        <OrbitalModal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-full max-w-[300px] aspect-square relative bg-black rounded border border-orbital-border overflow-hidden">
                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-orbital-bg text-center">
                            <VideoOff className="text-orbital-danger mb-2" size={40} />
                            <p className="text-orbital-danger font-bold text-sm mb-2">{error}</p>
                            <OrbitalButton variant="outline" size="sm" onClick={() => window.location.reload()}>Recarregar</OrbitalButton>
                        </div>
                    ) : (
                        <>
                            <div id={elementId} style={{ width: '100%', height: '100%', objectFit: 'cover' }}></div>
                            {isScanning && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-3/5 h-3/5 border-2 border-orbital-accent/70 rounded relative shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                        {/* Corner markers */}
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-orbital-accent"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-orbital-accent"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-orbital-accent"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-orbital-accent"></div>
                                    </div>
                                </div>
                            )}
                            {!isScanning && !error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <Loader2 className="animate-spin text-orbital-accent" size={32} />
                                </div>
                            )}
                        </>
                    )}
                </div>
                <p className="text-xs text-orbital-subtext text-center">
                    Posicione o código QR ou de barras dentro da área demarcada.
                </p>
            </div>
        </OrbitalModal>
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
                        <title>${escapeHtml(item.name)}</title>
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
                            <div class="title">${escapeHtml(item.name)}</div>
                            <div class="meta">Lote: ${escapeHtml(item.lotNumber)} | Val: ${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</div>
                            ${svgHtml}
                            <div class="meta" style="margin-top: 5px;">${escapeHtml(item.id)}</div>
                        </div>
                        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <OrbitalModal isOpen={isOpen} onClose={onClose} title="Etiqueta Digital" size="sm">
            <div className="flex flex-col items-center gap-4 py-2">
                <div className="p-4 bg-white rounded border border-orbital-border flex flex-col items-center">
                     <QRCode id="qr-code-svg" value={qrString} size={180} level="M" fgColor="#000000" />
                     <span className="mt-2 font-mono text-xs text-gray-500">{item.id || 'NOVO'}</span>
                </div>
                <div className="text-center">
                    <h4 className="font-bold text-lg text-orbital-text mb-1">{item.name}</h4>
                    <p className="font-mono text-sm text-orbital-subtext">Lote: {item.lotNumber}</p>
                </div>
            </div>
            <div className="flex justify-center gap-3 pt-4 border-t border-orbital-border mt-4">
                 <OrbitalButton variant="outline" onClick={handleDownload} icon={<Download size={16} />}>Salvar</OrbitalButton>
                 <OrbitalButton variant="primary" onClick={handlePrint} icon={<Printer size={16} />}>Imprimir</OrbitalButton>
            </div>
        </OrbitalModal>
    );
};

// ============================================================================
// MODAL: ADICIONAR ITEM
// ============================================================================

export const AddItemModal: React.FC<ItemModalBaseProps & { initialData?: Partial<CreateItemDTO> }> = ({ isOpen, onClose, initialData }) => {
    return (
        <OrbitalModal isOpen={isOpen} onClose={onClose} title={initialData ? 'Clonar Item' : 'Cadastrar Novo Item'} size="lg">
             <div className="p-1">
                <AddItem onCancel={onClose} initialData={initialData} />
             </div>
        </OrbitalModal>
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

  useEffect(() => {
      if (item && (item.id !== editedItem?.id || !isOpen)) {
          // eslint-disable-next-line
          setEditedItem(item);
      }
  }, [item, isOpen, editedItem]);

  const handleScanSuccess = (decodedText: string) => {
      setIsScannerOpen(false);
      if (editedItem && activeScanField) {
          let val = decodedText;
          try {
              const obj = JSON.parse(decodedText);
              if (activeScanField === 'sapCode' && obj.s) val = obj.s;
              if (activeScanField === 'lotNumber' && obj.l) val = obj.l;
          } catch(e) { /* ignore */ }
          setEditedItem({ ...editedItem, [activeScanField]: val });
          addToast('Scan Sucesso', 'success', 'Campo atualizado.');
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
        <OrbitalModal isOpen={isOpen} onClose={onClose} title={`Editar Item: ${editedItem.id}`} size="lg">
            <div className="p-1">
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
        </OrbitalModal>
        
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
            // eslint-disable-next-line
            if (quantity !== 1) setQuantity(1);
            if (observation !== '') setObservation('');
            if (type !== 'SAIDA') setType('SAIDA');
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
        <OrbitalModal isOpen={isOpen} onClose={onClose} title="Registrar Movimento" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 border border-orbital-border rounded bg-orbital-bg/50 flex gap-3 items-start">
                    <div className="p-2 bg-orbital-surface rounded border border-orbital-border">
                        <Package className="text-orbital-accent" />
                    </div>
                    <div>
                         <h4 className="font-bold text-orbital-text">{item.name}</h4>
                         <p className="text-xs text-orbital-subtext font-mono">Lote: {item.lotNumber}</p>
                         <p className="text-sm font-bold text-orbital-text mt-1">Saldo: {item.quantity} {item.baseUnit}</p>
                    </div>
                </div>

                <OrbitalSelect
                    label="Tipo de Operação"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    options={[
                        { value: 'SAIDA', label: 'Saída / Consumo' },
                        { value: 'ENTRADA', label: 'Entrada / Devolução' },
                        { value: 'AJUSTE', label: 'Ajuste de Inventário' }
                    ]}
                    fullWidth
                />

                <OrbitalInput
                    label="Quantidade"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
                    required
                    autoFocus
                    fullWidth
                    step="any"
                    min="0.0001"
                    startAdornment={<span className="text-xs font-mono">{item.baseUnit}</span>}
                />

                <OrbitalInput
                    label="Justificativa (Opcional)"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    fullWidth
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-orbital-border mt-4">
                    <OrbitalButton variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</OrbitalButton>
                    <OrbitalButton
                        type="submit"
                        variant={type === 'SAIDA' ? 'danger' : type === 'ENTRADA' ? 'primary' : 'outline'}
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        icon={<Save size={16} />}
                    >
                        Confirmar
                    </OrbitalButton>
                </div>
            </form>
        </OrbitalModal>
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
             // eslint-disable-next-line
             if (selectedId !== '') setSelectedId('');
             if (qty !== 1) setQty(1);
             if (searchTerm !== '') setSearchTerm('');
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
        <OrbitalModal isOpen={isOpen} onClose={onClose} title="Solicitar Compra" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <OrbitalInput
                    label="Buscar Produto"
                    placeholder="Digite para filtrar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                    startAdornment={<Search size={16} />}
                />

                <OrbitalSelect
                    label="Selecione o Item"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    options={filteredItems.map(item => ({
                        value: item.id,
                        label: `${item.name} (${item.quantity} ${item.baseUnit})`
                    }))}
                    fullWidth
                    required
                />

                <OrbitalInput
                    label="Quantidade Necessária"
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value))}
                    required
                    fullWidth
                    min="1"
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-orbital-border mt-4">
                    <OrbitalButton variant="ghost" type="button" onClick={onClose}>Cancelar</OrbitalButton>
                    <OrbitalButton
                        type="submit"
                        variant="primary"
                        disabled={!selectedId}
                        icon={<ShoppingCart size={16} />}
                    >
                        Adicionar
                    </OrbitalButton>
                </div>
            </form>
        </OrbitalModal>
    );
};
