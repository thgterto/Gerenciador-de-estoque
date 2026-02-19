import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, CreateItemDTO, ItemType, RiskFlags } from '../types';
import { InventoryService } from '../services/InventoryService'; 
import { useAlert } from '../context/AlertContext';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalSelect } from './ui/orbital/OrbitalSelect';
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { BatchList } from './BatchList'; 
import { useDebounce } from '../hooks/useDebounce';
import { useItemForm } from '../hooks/useItemForm';
import { useCasSearch } from '../hooks/useCasSearch';
import { TypeSelector } from './item-form/TypeSelector';
import { RiskSelector } from './item-form/RiskSelector';
import { BatchInfo } from './item-form/BatchInfo';
import { StorageInfo } from './item-form/StorageInfo';
import { CasApiService } from '../services/CasApiService';
import { Package, FlaskConical, Search, ScanLine, Save, X, History, QrCode } from 'lucide-react';

interface ItemFormProps {
    initialData?: Partial<InventoryItem>;
    onSubmit: (data: Partial<InventoryItem>) => Promise<void>;
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

    // Helper: Categories
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
            // eslint-disable-next-line
            if (showSuggestions) setShowSuggestions(false);
        }
    }, [debouncedSearchTerm, showSuggestions]);

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
        <form onSubmit={handleSubmit} autoComplete="off">
            <div className="flex flex-col gap-6 pb-20">
                <TypeSelector currentType={itemType} onChange={handleTypeChange} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* COLUNA ESQUERDA: DADOS BÁSICOS */}
                    <div className="flex flex-col gap-6">
                        <OrbitalCard>
                            <div className="flex items-center gap-2 mb-4 text-orbital-subtext border-b border-orbital-border pb-2">
                                <Package size={18} />
                                <h4 className="font-bold text-sm uppercase tracking-wide">Definição do Produto</h4>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="relative" ref={suggestionsRef}>
                                    <OrbitalInput
                                        label="Nome do Item"
                                        required
                                        value={formData.name || ''}
                                        onChange={e => handleNameChange(e.target.value)}
                                        error={errors.name}
                                        placeholder={itemType === 'REAGENT' ? "Ex: Ácido Sulfúrico" : "Nome do item"}
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-orbital-surface border border-orbital-border shadow-glow-lg rounded max-h-60 overflow-y-auto">
                                            {suggestions.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => selectSuggestion(item)}
                                                    className="w-full text-left px-4 py-2 hover:bg-orbital-bg transition-colors"
                                                >
                                                    <div className="text-sm font-bold text-orbital-text">{item.name}</div>
                                                    <div className="text-xs text-orbital-subtext">{item.sapCode}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <OrbitalSelect
                                        label="Categoria"
                                        required
                                        value={formData.category || ''}
                                        onChange={e => handleChange('category', e.target.value)}
                                        error={errors.category}
                                        options={[
                                            ...getCategoriesByType(itemType).map(c => ({ label: c, value: c })),
                                            { label: 'Outros', value: 'Outros' }
                                        ]}
                                    />
                                    <OrbitalInput
                                        label="Unidade (Base)"
                                        required
                                        value={formData.baseUnit || ''}
                                        onChange={e => handleChange('baseUnit', e.target.value)}
                                        error={errors.baseUnit}
                                        placeholder="Ex: UN, L, kg"
                                    />
                                </div>

                                <OrbitalInput
                                    label="Código SAP / SKU"
                                    value={formData.sapCode || ''}
                                    onChange={e => handleChange('sapCode', e.target.value)}
                                    placeholder="Opcional"
                                    startAdornment={
                                        onScan && (
                                            <button type="button" onClick={() => onScan('sapCode')} className="hover:text-orbital-accent">
                                                <ScanLine size={16} />
                                            </button>
                                        )
                                    }
                                />
                            </div>
                        </OrbitalCard>

                        {itemType === 'REAGENT' && (
                            <OrbitalCard className="border-orbital-danger/30 bg-orbital-danger/5">
                                <div className="flex items-center gap-2 mb-4 text-orbital-danger border-b border-orbital-danger/30 pb-2">
                                    <FlaskConical size={18} />
                                    <h4 className="font-bold text-sm uppercase tracking-wide">Dados Químicos (GHS)</h4>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <OrbitalInput
                                        label="CAS Number"
                                        value={formData.casNumber || ''}
                                        onChange={e => handleChange('casNumber', e.target.value)}
                                        placeholder="Ex: 67-64-1"
                                        disabled={isCasLoading}
                                        startAdornment={
                                            <button type="button" onClick={onCasSearch} disabled={isCasLoading} className="hover:text-orbital-accent">
                                                <Search size={16} />
                                            </button>
                                        }
                                    />

                                    {casResult && (
                                        <div className="p-3 border border-orbital-border rounded bg-orbital-surface flex gap-3 items-center">
                                            <img
                                                src={`https://commonchemistry.cas.org/api/image?cas_rn=${CasApiService.normalizeCas(formData.casNumber || '')}`}
                                                alt={`Chemical Structure of ${casResult.name}`}
                                                className="w-12 h-12 object-contain bg-white rounded border border-orbital-border"
                                                onError={(e: any) => e.target.style.display = 'none'}
                                            />
                                            <div>
                                                <div className="font-bold text-orbital-text">{casResult.name}</div>
                                                <div className="text-xs text-orbital-subtext font-mono">
                                                    {casResult.molecularFormula} • MW: {casResult.molecularMass}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <RiskSelector
                                        risks={formData.risks || INITIAL_RISKS}
                                        onChange={(r) => handleChange('risks', r)}
                                    />
                                </div>
                            </OrbitalCard>
                        )}
                    </div>

                    {/* COLUNA DIREITA: LOGÍSTICA */}
                    <div className="flex flex-col gap-6">
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
                    <OrbitalCard>
                        <div className="flex items-center gap-2 mb-4 text-orbital-subtext border-b border-orbital-border pb-2">
                            <History size={18} />
                            <h4 className="font-bold text-sm uppercase tracking-wide">Histórico de Lotes</h4>
                        </div>
                        <BatchList itemId={initialData.id!} onViewHistory={onViewBatchHistory} />
                    </OrbitalCard>
                )}
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-orbital-bg/90 backdrop-blur border-t border-orbital-border z-40 flex justify-between items-center shadow-glow-lg">
                <div>
                    {onGenerateQR && isEditMode && (
                        <OrbitalButton
                            variant="outline"
                            type="button"
                            onClick={() => onGenerateQR(formData)}
                            icon={<QrCode size={16} />}
                            className="hidden sm:flex"
                        >
                            Etiqueta
                        </OrbitalButton>
                    )}
                </div>
                <div className="flex gap-4">
                    <OrbitalButton variant="ghost" type="button" onClick={onCancel} disabled={isSubmitting} icon={<X size={16} />}>
                        Cancelar
                    </OrbitalButton>
                    <OrbitalButton
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        icon={<Save size={16} />}
                    >
                        {submitLabel}
                    </OrbitalButton>
                </div>
            </div>
        </form>
    );
};
