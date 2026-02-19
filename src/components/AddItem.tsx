import React, { useState } from 'react';
import { InventoryService } from '../services/InventoryService';
import { useAlert } from '../context/AlertContext';
import { QRScannerModal } from './Modals';
import { Button } from './ui/Button';
import { QRCodeDataDTO, CreateItemDTO } from '../types';
import { ItemForm } from './ItemForm';
import { Box, Paper, Typography } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

interface Props {
  onCancel: () => void;
  initialData?: Partial<CreateItemDTO>; 
}

export const AddItem: React.FC<Props> = ({ onCancel, initialData }) => {
  const { addToast } = useAlert();
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<'FULL' | keyof CreateItemDTO>('FULL');
  const [formData, setFormData] = useState<Partial<CreateItemDTO> | undefined>(initialData);

  const handleSubmit = async (data: any) => {
      try {
          await InventoryService.addItem(data);
          addToast('Sucesso', 'success', 'Item adicionado ao inventário.');
          onCancel();
      } catch (error) {
          console.error(error);
          addToast('Erro', 'error', 'Falha ao adicionar item.');
      }
  };

  const handleScanClick = (target: 'FULL' | keyof CreateItemDTO) => {
      setScanTarget(target);
      setShowScanner(true);
  };

  const handleScanSuccess = (decodedText: string) => {
      setShowScanner(false);
      
      try {
          // Tenta parsear JSON proprietário (QR LabControl)
          const data = JSON.parse(decodedText);
          
          if (scanTarget === 'FULL') {
             // Lógica de preenchimento completo
             let itemData: Partial<CreateItemDTO> = {};
             if (data.i && data.n) {
                 const dto = data as QRCodeDataDTO;
                 itemData = {
                     name: dto.n,
                     sapCode: dto.s,
                     lotNumber: dto.l,
                     baseUnit: dto.u || 'UN',
                     expiryDate: dto.e || ''
                 };
             } else {
                 // Formato Genérico JSON
                 itemData = {
                     name: data.name,
                     sapCode: data.sap || data.code || data.sku,
                     lotNumber: data.lot || data.batch
                 };
             }
             setFormData(prev => ({ ...prev, ...itemData }));
             addToast('Dados Carregados', 'success');

          } else {
             // Lógica de Campo Específico
             let val = decodedText;
             if (scanTarget === 'sapCode' && data.s) val = data.s;
             if (scanTarget === 'lotNumber' && data.l) val = data.l;
             
             setFormData(prev => ({ ...prev, [scanTarget]: val }));
             addToast('Campo Preenchido', 'success', val);
          }

      } catch (e) {
          // Fallback para texto plano
          if (scanTarget === 'FULL') {
               setFormData(prev => ({ ...prev, sapCode: decodedText }));
               addToast('Código de Barras', 'info', 'Código inserido no campo SAP/SKU.');
          } else {
               setFormData(prev => ({ ...prev, [scanTarget]: decodedText }));
               addToast('Leitura Realizada', 'success');
          }
      }
  };

  return (
    <>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
            {!initialData && (
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'primary.lighter', borderColor: 'primary.light' }}>
                    <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'background.paper', color: 'primary.main', display: 'flex' }}>
                        <QrCodeScannerIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">Leitura Rápida</Typography>
                        <Typography variant="caption" color="text.secondary">Escaneie um código para preencher os dados.</Typography>
                    </Box>
                    <Button
                        type="button"
                        onClick={() => handleScanClick('FULL')}
                        variant="primary"
                        size="sm"
                        icon="qr_code_scanner"
                    >
                        Escanear
                    </Button>
                </Paper>
            )}

            <ItemForm
                initialData={formData || initialData}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                submitLabel="Confirmar Cadastro"
                onScan={(field) => handleScanClick(field)}
            />
        </Box>

        <QRScannerModal 
            isOpen={showScanner} 
            onClose={() => setShowScanner(false)} 
            onScanSuccess={handleScanSuccess} 
            title={scanTarget === 'FULL' ? 'Escanear Item' : `Escanear ${scanTarget === 'sapCode' ? 'Código' : 'Lote'}`}
        />
    </>
  );
};
