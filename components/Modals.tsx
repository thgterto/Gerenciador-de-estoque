import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, QRCodeDataDTO, CreateItemDTO } from '../types';
import * as ReactQRCode from 'react-qr-code';
const QRCode = (ReactQRCode as any).default || ReactQRCode;
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, MenuItem, IconButton, Typography, Box,
    InputAdornment, Stack, FormControl, InputLabel, Select, CircularProgress
} from '@mui/material';

// Icons
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CloseIcon from '@mui/icons-material/Close';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

import { ItemForm } from './ItemForm';
import { AddItem } from './AddItem';
import { useAlert } from '../context/AlertContext';
import { useScanner } from '../hooks/useScanner';

interface ItemModalBaseProps {
    isOpen: boolean;
    onClose: () => void;
}

const BootstrapDialogTitle = (props: { children?: React.ReactNode; onClose: () => void; subtitle?: string }) => {
  const { children, onClose, subtitle, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }} {...other}>
      <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>{children}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{subtitle}</Typography>}
      </Box>
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
            mt: -0.5
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

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
        <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
             <BootstrapDialogTitle onClose={onClose}>{title}</BootstrapDialogTitle>
             <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                    <Box sx={{
                        width: '100%', maxWidth: 300, aspectRatio: '1/1', position: 'relative',
                        bgcolor: 'black', borderRadius: 2, overflow: 'hidden', border: '1px solid #ccc'
                    }}>
                        {error ? (
                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: 'background.paper', textAlign: 'center' }}>
                                <VideocamOffIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography color="error" variant="body2" fontWeight="bold" gutterBottom>{error}</Typography>
                                <Button variant="outlined" size="small" onClick={() => window.location.reload()}>Recarregar</Button>
                            </Box>
                        ) : (
                            <>
                                <div id={elementId} style={{ width: '100%', height: '100%', objectFit: 'cover' }}></div>
                                {isScanning && (
                                    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Box sx={{ width: '60%', height: '60%', border: '2px solid rgba(255,255,255,0.7)', borderRadius: 2, position: 'relative' }}>
                                            {/* Corner markers could be added here */}
                                        </Box>
                                    </Box>
                                )}
                                {!isScanning && !error && (
                                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.1)' }}>
                                        <CircularProgress />
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" align="center">
                        Posicione o código QR ou de barras dentro da área demarcada.
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
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
        // ... (Keep existing print logic, it's vanilla JS essentially)
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
        <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
             <BootstrapDialogTitle onClose={onClose}>Etiqueta Digital</BootstrapDialogTitle>
             <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <QRCode id="qr-code-svg" value={qrString} size={180} level="M" fgColor="#000000" />
                         <Typography variant="caption" sx={{ mt: 1, fontFamily: 'monospace', color: 'text.secondary' }}>{item.id || 'NOVO'}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            Lote: {item.lotNumber}
                        </Typography>
                    </Box>
                </Box>
             </DialogContent>
             <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
                 <Button variant="outlined" onClick={handleDownload} startIcon={<DownloadIcon />}>Salvar</Button>
                 <Button variant="contained" onClick={handlePrint} startIcon={<PrintIcon />}>Imprimir</Button>
             </DialogActions>
        </Dialog>
    );
};

// ============================================================================
// MODAL: ADICIONAR ITEM
// ============================================================================

export const AddItemModal: React.FC<ItemModalBaseProps & { initialData?: Partial<CreateItemDTO> }> = ({ isOpen, onClose, initialData }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <BootstrapDialogTitle onClose={onClose} subtitle={initialData ? 'Crie um novo lote a partir de um item existente' : 'Preencha os dados do novo material'}>
                {initialData ? 'Clonar Item' : 'Cadastrar Novo Item'}
            </BootstrapDialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                 {/* Pass onClose to AddItem so it can close the modal on cancel */}
                 <Box sx={{ p: 3 }}>
                    <AddItem onCancel={onClose} initialData={initialData} />
                 </Box>
            </DialogContent>
        </Dialog>
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
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <BootstrapDialogTitle onClose={onClose} subtitle={editedItem.id}>Editar Item</BootstrapDialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    <ItemForm 
                        initialData={editedItem} 
                        onSubmit={handleFormSubmit} 
                        onCancel={onClose}
                        submitLabel="Salvar Alterações"
                        onViewBatchHistory={onViewBatchHistory}
                        onScan={(field) => { setActiveScanField(field); setIsScannerOpen(true); }}
                        onGenerateQR={() => setShowQRModal(true)}
                    />
                </Box>
            </DialogContent>
        </Dialog>
        
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
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <BootstrapDialogTitle onClose={onClose}>Registrar Movimento</BootstrapDialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
                            <Inventory2Icon color="primary" />
                        </Box>
                        <Box>
                             <Typography variant="subtitle2" fontWeight="bold">{item.name}</Typography>
                             <Typography variant="caption" display="block" color="text.secondary">Lote: {item.lotNumber}</Typography>
                             <Typography variant="caption" fontWeight="bold">Saldo: {item.quantity} {item.baseUnit}</Typography>
                        </Box>
                    </Box>

                    <Stack spacing={3}>
                        <TextField
                            select
                            label="Tipo de Operação"
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            fullWidth
                        >
                            <MenuItem value="SAIDA">Saída / Consumo</MenuItem>
                            <MenuItem value="ENTRADA">Entrada / Devolução</MenuItem>
                            <MenuItem value="AJUSTE">Ajuste de Inventário</MenuItem>
                        </TextField>

                        <TextField
                            label="Quantidade"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value))}
                            required
                            autoFocus
                            fullWidth
                            InputProps={{
                                endAdornment: <InputAdornment position="end">{item.baseUnit}</InputAdornment>,
                            }}
                            inputProps={{ min: 0.0001, step: "any" }}
                        />

                        <TextField
                            label="Justificativa (Opcional)"
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color={type === 'SAIDA' ? 'error' : type === 'ENTRADA' ? 'success' : 'warning'}
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
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
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <BootstrapDialogTitle onClose={onClose}>Solicitar Compra</BootstrapDialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        <TextField
                            label="Buscar Produto"
                            placeholder="Digite para filtrar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><QrCodeScannerIcon /></InputAdornment>, // Using QR icon as generic search/scan here or just search
                            }}
                        />

                        <FormControl fullWidth required>
                            <InputLabel id="select-item-label">Selecione o Item</InputLabel>
                            <Select
                                labelId="select-item-label"
                                value={selectedId}
                                label="Selecione o Item"
                                onChange={(e) => setSelectedId(e.target.value)}
                                native={false} // Use MUI Select
                            >
                                {filteredItems.map(item => (
                                    <MenuItem key={item.id} value={item.id}>
                                        {item.name} ({item.quantity} {item.baseUnit})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Quantidade Necessária"
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(parseInt(e.target.value))}
                            required
                            fullWidth
                            inputProps={{ min: 1 }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!selectedId}
                        startIcon={<AddShoppingCartIcon />}
                    >
                        Adicionar
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
