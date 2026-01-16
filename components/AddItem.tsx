import React, { useState } from 'react';
import { InventoryService } from '../services/InventoryService';
import { useAlert } from '../context/AlertContext';
import { QRScannerModal } from './Modals';
import { Button } from './ui/Button';
import { QRCodeDataDTO, CreateItemDTO } from '../types';
import { ItemForm } from './ItemForm';

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
             // Se for um JSON complexo mas estamos escaneando campo único, tenta extrair
             if (scanTarget === 'sapCode' && data.s) val = data.s;
             if (scanTarget === 'lotNumber' && data.l) val = data.l;
             
             setFormData(prev => ({ ...prev, [scanTarget]: val }));
             addToast('Campo Preenchido', 'success', val);
          }

      } catch (e) {
          // Fallback para texto plano (Códigos de Barras comuns)
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
        <div className="flex flex-col gap-6 animate-slide-up">
            {!initialData && (
                <div className="bg-primary/5 p-4 rounded-xl flex items-center gap-4 border border-primary/10">
                    <div className="bg-surface-light dark:bg-slate-800 p-2 rounded-full shadow-sm text-primary border border-border-light dark:border-border-dark">
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm text-text-main dark:text-white">Leitura Rápida</h3>
                        <p className="text-xs text-text-secondary dark:text-gray-400">Escaneie um código para preencher os dados.</p>
                    </div>
                    <Button 
                        type="button"
                        onClick={() => handleScanClick('FULL')}
                        variant="primary"
                        size="sm"
                        icon="photo_camera"
                    >
                        Escanear
                    </Button>
                </div>
            )}

            <div className="bg-surface-light dark:bg-surface-dark">
                <ItemForm 
                    initialData={formData || initialData} 
                    onSubmit={handleSubmit} 
                    onCancel={onCancel}
                    submitLabel="Confirmar Cadastro"
                    onScan={(field) => handleScanClick(field)}
                />
            </div>
        </div>

        <QRScannerModal 
            isOpen={showScanner} 
            onClose={() => setShowScanner(false)} 
            onScanSuccess={handleScanSuccess} 
            title={scanTarget === 'FULL' ? 'Escanear Item' : `Escanear ${scanTarget === 'sapCode' ? 'Código' : 'Lote'}`}
        />
    </>
  );
};