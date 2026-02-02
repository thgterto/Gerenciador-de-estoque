
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, CreateItemDTO, ItemType, RiskFlags } from '../types';
import { InventoryService } from '../services/InventoryService'; 
import { useAlert } from '../context/AlertContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card'; 
import { Select } from './ui/Select'; 
import { BatchList } from './BatchList'; 
import { useDebounce } from '../hooks/useDebounce';
import { useItemForm } from '../hooks/useItemForm';
import { useCasSearch } from '../hooks/useCasSearch';
import { TypeSelector } from './item-form/TypeSelector';
import { RiskSelector } from './item-form/RiskSelector';
import { BatchInfo } from './item-form/BatchInfo';
import { StorageInfo } from './item-form/StorageInfo';
import { CasApiService } from '../services/CasApiService';

interface ItemFormProps {
    initialData?: Partial<InventoryItem>;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    submitLabel?: string;
    onViewBatchHistory?: (batchId: string) => void;
    onScan?: (field: keyof CreateItemDTO) => void;
    onGenerateQR?: (itemData: Partial<InventoryItem>) => void;
}

const INITIAL_RISKS: RiskFlags = { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false };

export const ItemForm: React.FC<ItemFormProps> = ({ 
    initialData, 
    onSubmit, 
    onCancel,
    submitLabel = "Confirmar Cadastro",
    onViewBatchHistory,
    onScan,
    onGenerateQR
}) => {
    const { addToast } = useAlert();
    const {
        formData, setFormData, errors, itemType, setItemType,
        handleChange, handleTypeChange, handleSubmit, isSubmitting
    } = useItemForm({ initialData, onSubmit });

    const { isCasLoading, casResult, setCasResult, searchCas } = useCasSearch();

    // Suggestion State
    const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState(initialData?.name || '');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const isEditMode = !!initialData?.id;

    // Helper: Categories (Could be moved to constants)
    const getCategoriesByType = (type: ItemType) => {
        switch(type) {
            case 'REAGENT': return ['Ácidos', 'Bases', 'Sais', 'Solventes', 'Padrões', 'Meios de Cultura'];
            case 'GLASSWARE': return ['Béqueres', 'Erlenmeyers', 'Provetas', 'Pipetas', 'Balões', 'Frascos'];
            case 'EQUIPMENT': return ['Medição', 'Aquecimento', 'Agitação', 'Microscopia', 'Centrífugas'];
            case 'SPARE_PART': return ['Mecânica', 'Elétrica', 'Vedação (O-rings)', 'Sensores', 'Filtros', 'Conexões'];
            case 'CONSUMABLE': return ['EPIs', 'Descartáveis', 'Limpeza', 'Papelaria', 'Filtros'];
            default: return [];
        }
    };

    // Initialize Search Term
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (initialData?.name) setSearchTerm(initialData.name);
    }, [initialData]);

    // Handle Name Change wrapper
    const handleNameChange = (val: string) => {
        handleChange('name', val);
        setSearchTerm(val);
    };

    // Suggestions Logic
    useEffect(() => {
        if (debouncedSearchTerm.length > 2) {
             const term = debouncedSearchTerm.toLowerCase();
             InventoryService.getAllItems().then(items => {
                 const matches = items.filter(i => 
                     i.name.toLowerCase().includes(term) || 
                     (i.sapCode && i.sapCode.toLowerCase().includes(term))
                 );
                 const uniqueMap = new Map();
                 matches.forEach(item => { if(!uniqueMap.has(item.name)) uniqueMap.set(item.name, item); });
                 setSuggestions(Array.from(uniqueMap.values()).slice(0, 5));
                 setShowSuggestions(uniqueMap.size > 0);
             });
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowSuggestions(false);
        }
    }, [debouncedSearchTerm]);

    const selectSuggestion = (item: InventoryItem) => {
        setFormData(prev => ({
            ...prev,
            name: item.name,
            sapCode: item.sapCode,
            category: item.category,
            baseUnit: item.baseUnit,
            minStockLevel: item.minStockLevel,
            supplier: item.supplier,
            molecularFormula: item.molecularFormula,
            molecularWeight: item.molecularWeight,
            casNumber: item.casNumber,
            risks: item.risks || { ...INITIAL_RISKS },
            itemType: item.itemType || prev.itemType
        }));
        setSearchTerm(item.name);
        if (item.itemType) setItemType(item.itemType);

        if (item.casNumber) {
             setCasResult({
                rn: item.casNumber,
                name: item.name,
                molecularFormula: item.molecularFormula,
                molecularMass: item.molecularWeight
            });
        }
        setShowSuggestions(false);
        addToast('Modelo Carregado', 'info', 'Dados copiados. Preencha o lote.');
    };

    const handleGenerateInternalBatch = () => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const code = `INT-${dateStr}-${randomSuffix}`;
        handleChange('lotNumber', code);
        addToast('Lote Gerado', 'success', code);
    };

    const onCasSearch = async () => {
        const result = await searchCas(formData.casNumber);
        if (result) {
            // Update name only if it's empty to avoid overwriting user input,
            // but always update chemical data (risks, formula, etc).
            if (!formData.name) {
                setSearchTerm(result.name);
                handleChange('name', result.name);
            }

            if (result.risks) handleChange('risks', { ...formData.risks, ...result.risks });
            if (result.molecularFormula) handleChange('molecularFormula', result.molecularFormula);
            if (result.molecularWeight) handleChange('molecularWeight', result.molecularWeight);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full relative" autoComplete="off">
            
            <TypeSelector currentType={itemType} onChange={handleTypeChange} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full pb-20">
                
                {/* COLUNA ESQUERDA: DADOS BÁSICOS */}
                <div className="flex flex-col gap-6">
                    <Card noBorder className="shadow-sm border border-border-light dark:border-border-dark" padding="p-5">
                        <div className="flex items-center gap-2 mb-4 border-b border-border-light dark:border-border-dark pb-2">
                            <span className="material-symbols-outlined text-text-secondary text-[20px]">inventory_2</span> 
                            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400">Definição do Produto</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="relative" ref={suggestionsRef}>
                                <Input 
                                    label="Nome do Item"
                                    required
                                    value={formData.name || ''} 
                                    onChange={e => handleNameChange(e.target.value)}
                                    error={errors.name}
                                    placeholder={itemType === 'REAGENT' ? "Ex: Ácido Sulfúrico" : "Nome do item"}
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-border-light rounded-lg shadow-xl mt-1 overflow-hidden">
                                        {suggestions.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => selectSuggestion(item)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b last:border-0 border-slate-100 dark:border-slate-700"
                                            >
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-[10px] text-gray-500">{item.sapCode}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Categoria"
                                    required
                                    value={formData.category || ''}
                                    onChange={e => handleChange('category', e.target.value)}
                                    error={errors.category}
                                    options={[
                                        { label: 'Selecione...', value: '', disabled: true },
                                        ...getCategoriesByType(itemType).map(c => ({ label: c, value: c })),
                                        { label: 'Outros', value: 'Outros' }
                                    ]}
                                />
                                <Input 
                                    label="Unidade (Base)"
                                    required
                                    value={formData.baseUnit || ''} 
                                    onChange={e => handleChange('baseUnit', e.target.value)}
                                    error={errors.baseUnit}
                                    placeholder="Ex: UN, L, kg"
                                />
                            </div>

                            <Input 
                                label="Código SAP / SKU"
                                value={formData.sapCode || ''} 
                                onChange={e => handleChange('sapCode', e.target.value)}
                                placeholder="Opcional"
                                rightElement={
                                    onScan && (
                                        <button 
                                            type="button" 
                                            onClick={() => onScan('sapCode')} 
                                            className="text-text-secondary hover:text-primary transition-colors p-1"
                                            title="Escanear"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                                        </button>
                                    )
                                }
                            />
                        </div>
                    </Card>

                    {itemType === 'REAGENT' && (
                        <Card noBorder className="shadow-sm border border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10" padding="p-5">
                            <div className="flex items-center gap-2 mb-4 border-b border-red-200 dark:border-red-800 pb-2">
                                <span className="material-symbols-outlined text-red-500 text-[20px]">science</span> 
                                <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Dados Químicos (GHS)</h3>
                            </div>

                            <div className="space-y-4">
                                <Input 
                                    label="CAS Number"
                                    value={formData.casNumber || ''} 
                                    onChange={e => handleChange('casNumber', e.target.value)}
                                    placeholder="Ex: 67-64-1"
                                    isLoading={isCasLoading}
                                    rightElement={
                                        <button 
                                            type="button" 
                                            onClick={onCasSearch}
                                            disabled={isCasLoading} 
                                            className="text-text-secondary hover:text-primary transition-colors p-1"
                                            title="Buscar na API CAS"
                                        >
                                            <span className="material-symbols-outlined">search</span>
                                        </button>
                                    }
                                />

                                {casResult && (
                                    <div className="p-3 bg-white dark:bg-slate-800 border border-red-100 rounded-lg flex gap-3 items-center shadow-sm">
                                        <div className="bg-white p-1 rounded border shrink-0 size-12 flex items-center justify-center">
                                            <img src={`https://commonchemistry.cas.org/api/image?cas_rn=${CasApiService.normalizeCas(formData.casNumber || '')}`} alt="Str" className="max-w-full max-h-full" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{casResult.name}</div>
                                            <div className="text-[10px] text-slate-500 flex gap-2">
                                                <span>{casResult.molecularFormula}</span>
                                                <span>MW: {casResult.molecularMass}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <RiskSelector
                                    risks={formData.risks || INITIAL_RISKS}
                                    onChange={(r) => handleChange('risks', r)}
                                />
                            </div>
                        </Card>
                    )}
                </div>

                {/* COLUNA DIREITA: LOGÍSTICA & ESTOQUE */}
                <div className="flex flex-col gap-6 w-full">
                    <BatchInfo
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        itemType={itemType}
                        isEditMode={isEditMode}
                        onGenerateInternalBatch={handleGenerateInternalBatch}
                        onScan={onScan}
                    />
                    
                    <StorageInfo
                        location={formData.location || { warehouse: '', cabinet: '', shelf: '', position: '' }}
                        onChange={handleChange}
                        errors={errors}
                    />
                </div>
            </div>

            {/* BATCH HISTORY (EDIT MODE ONLY) */}
            {isEditMode && initialData?.id && (
                <div className="mb-20">
                    <Card noBorder className="animate-fade-in w-full shadow-sm border border-border-light dark:border-border-dark" padding="p-5">
                        <div className="flex items-center gap-2 mb-4">
                             <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                             <h3 className="text-base font-bold text-text-main dark:text-white">
                                 Histórico de Lotes deste Produto
                             </h3>
                        </div>
                        <BatchList itemId={initialData.id!} onViewHistory={onViewBatchHistory} />
                    </Card>
                </div>
            )}

            {/* RODAPÉ FIXO (Sticky) */}
            <div className="sticky bottom-[-24px] z-20 -mx-6 px-6 py-4 bg-white/90 dark:bg-surface-dark/95 backdrop-blur border-t border-border-light dark:border-border-dark flex justify-between gap-3 mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="flex gap-2">
                    {onGenerateQR && isEditMode && (
                        <Button 
                            type="button" 
                            variant="white" 
                            icon="qr_code_2"
                            onClick={() => onGenerateQR(formData)}
                            className="hidden sm:flex"
                        >
                            Etiqueta
                        </Button>
                    )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <Button variant="ghost" onClick={onCancel} type="button" disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" variant="primary" icon="save" isLoading={isSubmitting} className="shadow-md">
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
};
