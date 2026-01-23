
import React from 'react';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { CreateItemDTO, ItemType } from '../../types';

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
        <Card noBorder className="shadow-sm border-2 border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-900/5 relative" padding="p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-blue-200 dark:border-blue-800 pb-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">layers</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Lote & Validade</h3>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={itemType === 'EQUIPMENT' ? "Patrimônio/Série" : "Lote / Série"}
                        value={formData.lotNumber || ''}
                        onChange={e => onChange('lotNumber', e.target.value)}
                        error={errors.lotNumber}
                        placeholder={itemType === 'EQUIPMENT' ? "Ex: PAT-001 (Vazio p/ auto)" : "Vazio p/ auto"}
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-200 pr-16"
                        rightElement={
                            <div className="flex items-center gap-1">
                                    <button
                                    type="button"
                                    onClick={onGenerateInternalBatch}
                                    className="text-text-secondary hover:text-blue-600 transition-colors p-1"
                                    title="Gerar Lote Interno"
                                    >
                                    <span className="material-symbols-outlined">autorenew</span>
                                    </button>
                                    {onScan && (
                                        <button
                                        type="button"
                                        onClick={() => onScan('lotNumber')}
                                        className="text-text-secondary hover:text-primary transition-colors p-1"
                                        title="Escanear"
                                        >
                                        <span className="material-symbols-outlined">qr_code_scanner</span>
                                        </button>
                                    )}
                            </div>
                        }
                    />

                    {itemType !== 'EQUIPMENT' && (
                        <Input
                            label="Validade"
                            type="date"
                            value={formData.expiryDate || ''}
                            onChange={e => onChange('expiryDate', e.target.value)}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                        />
                    )}
                </div>

                <Input
                    label="Fabricante / Fornecedor"
                    value={formData.supplier || ''}
                    onChange={e => onChange('supplier', e.target.value)}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                />

                    <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Qtd Inicial"
                        type="number"
                        step="0.001"
                        min={0}
                        value={formData.quantity}
                        onChange={e => onChange('quantity', Number(e.target.value))}
                        error={errors.quantity}
                        disabled={isEditMode}
                        helpText={isEditMode ? "Use 'Movimentar' para alterar." : ""}
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-200 font-bold"
                    />
                    <Input
                        label="Estoque Mínimo"
                        type="number"
                        step="1"
                        min={0}
                        value={formData.minStockLevel}
                        onChange={e => onChange('minStockLevel', Number(e.target.value))}
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                    />
                </div>
            </div>
        </Card>
    );
};
