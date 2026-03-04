import React from 'react';
import { OrbitalCard } from '../ui/orbital/OrbitalCard';
import { OrbitalInput } from '../ui/orbital/OrbitalInput';
import { CreateItemDTO, ItemType } from '../../types';
import { Layers, RefreshCw, ScanLine } from 'lucide-react';

interface BatchInfoProps {
    formData: Partial<CreateItemDTO>;
    onChange: (field: string, value: any) => void;
    errors: Record<string, string>;
    itemType: ItemType;
    isEditMode: boolean;
    onGenerateInternalBatch: () => void;
    onScan?: (field: keyof CreateItemDTO) => void;
}

export const BatchInfo: React.FC<BatchInfoProps> = ({
    formData,
    onChange,
    errors,
    itemType,
    isEditMode,
    onGenerateInternalBatch,
    onScan
}) => {
    return (
        <OrbitalCard>
            <div className="flex items-center gap-2 mb-4 text-orbital-accent border-b border-orbital-border pb-2">
                <Layers size={18} />
                <h4 className="font-bold text-sm uppercase tracking-wide">Lote & Validade</h4>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <OrbitalInput
                        label={itemType === 'EQUIPMENT' ? "Patrimônio/Série" : "Lote / Série"}
                        value={formData.lotNumber || ''}
                        onChange={e => onChange('lotNumber', e.target.value)}
                        error={errors.lotNumber}
                        placeholder={itemType === 'EQUIPMENT' ? "Ex: PAT-001" : "Vazio p/ auto"}
                        startAdornment={
                            <div className="flex gap-1 pr-2">
                                <button type="button" onClick={onGenerateInternalBatch} aria-label="Gerar Lote" title="Gerar Lote" className="hover:text-orbital-accent p-1">
                                    <RefreshCw size={14} />
                                </button>
                                {onScan && (
                                    <button type="button" onClick={() => onScan('lotNumber')} aria-label="Escanear" title="Escanear" className="hover:text-orbital-accent p-1">
                                        <ScanLine size={14} />
                                    </button>
                                )}
                            </div>
                        }
                    />

                    {itemType !== 'EQUIPMENT' && (
                        <OrbitalInput
                            label="Validade"
                            type="date"
                            value={formData.expiryDate || ''}
                            onChange={e => onChange('expiryDate', e.target.value)}
                        />
                    )}
                </div>

                <OrbitalInput
                    label="Fabricante / Fornecedor"
                    value={formData.supplier || ''}
                    onChange={e => onChange('supplier', e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <OrbitalInput
                        label="Qtd Inicial"
                        type="number"
                        step="0.001"
                        min="0"
                        value={String(formData.quantity ?? 0)}
                        onChange={e => onChange('quantity', Number(e.target.value))}
                        error={errors.quantity}
                        disabled={isEditMode}
                        // helpText not directly supported in OrbitalInput yet, could add it or ignore
                    />
                    <OrbitalInput
                        label="Estoque Mínimo"
                        type="number"
                        step="1"
                        min="0"
                        value={String(formData.minStockLevel ?? 0)}
                        onChange={e => onChange('minStockLevel', Number(e.target.value))}
                    />
                </div>
            </div>
        </OrbitalCard>
    );
};
