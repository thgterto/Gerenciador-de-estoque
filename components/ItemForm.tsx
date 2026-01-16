import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, RiskFlags, CasDataDTO, CreateItemDTO, ItemType } from '../types';
import { CasApiService } from '../services/CasApiService';
import { InventoryService } from '../services/InventoryService'; 
import { sanitizeProductName } from '../utils/stringUtils'; 
import { useAlert } from '../context/AlertContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Tooltip } from './Tooltip';
import { Card } from './ui/Card'; 
import { GHS_OPTIONS } from '../utils/businessRules';
import { Select } from './ui/Select'; 
import { BatchList } from './BatchList'; 
import { useDebounce } from '../hooks/useDebounce';

interface ItemFormProps {
    initialData?: Partial<InventoryItem>;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    submitLabel?: string;
    onViewBatchHistory?: (batchId: string) => void;
    // Novas props para integração com Modals
    onScan?: (field: keyof CreateItemDTO) => void;
    onGenerateQR?: (itemData: Partial<InventoryItem>) => void;
}

const TYPE_CONFIG: Record<ItemType, { label: string, icon: string, color: string, activeClass: string }> = {
    'REAGENT': { label: 'Reagente', icon: 'science', color: 'text-primary', activeClass: 'bg-primary text-white shadow-md' },
    'GLASSWARE': { label: 'Vidraria', icon: 'biotech', color: 'text-secondary', activeClass: 'bg-secondary text-white shadow-md' },
    'EQUIPMENT': { label: 'Equipamento', icon: 'precision_manufacturing', color: 'text-blue-600', activeClass: 'bg-blue-600 text-white shadow-md' },
    'SPARE_PART': { label: 'Peça Rep.', icon: 'settings_suggest', color: 'text-orange-500', activeClass: 'bg-orange-500 text-white shadow-md' },
    'CONSUMABLE': { label: 'Consumível', icon: 'inventory', color: 'text-emerald-600', activeClass: 'bg-emerald-600 text-white shadow-md' },
};

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
    const [isCasLoading, setIsCasLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [casResult, setCasResult] = useState<CasDataDTO | null>(null);

    // States para Sugestão e Validação
    const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const suggestionsRef = useRef<HTMLDivElement>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [itemType, setItemType] = useState<ItemType>('REAGENT');

    const [formData, setFormData] = useState<Partial<CreateItemDTO>>({
        name: '',
        itemType: 'REAGENT',
        category: '',
        baseUnit: 'UN',
        quantity: 0,
        minStockLevel: 0,
        lotNumber: '',
        location: { warehouse: 'Central', cabinet: '', shelf: '', position: '' },
        risks: { ...INITIAL_RISKS },
        ...initialData
    });

    const isEditMode = !!initialData?.id;

    // Categorias dinâmicas
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

    useEffect(() => {
        if (initialData) {
            // Merge cuidadoso para não sobrescrever state local se o pai re-renderizar sem mudanças reais
            setFormData(prev => ({ ...prev, ...initialData }));
            
            if (initialData.name && !searchTerm) setSearchTerm(initialData.name); 
            
            if (initialData.itemType) setItemType(initialData.itemType);
            else if (initialData.molecularFormula || initialData.casNumber) setItemType('REAGENT');
            
            if (initialData.molecularFormula && !casResult) {
                setCasResult({
                    rn: initialData.casNumber || '',
                    name: initialData.name || '',
                    molecularFormula: initialData.molecularFormula,
                    molecularMass: initialData.molecularWeight
                });
            }
        }
    }, [initialData]);

    // Busca de Sugestões
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
            setShowSuggestions(false);
        }
    }, [debouncedSearchTerm]);

    const handleTypeChange = (type: ItemType) => {
        setItemType(type);
        setFormData(prev => ({ ...prev, itemType: type, category: '' }));
        setErrors({});
    };

    const handleChange = (field: string, value: any) => {
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => {
                const parentObj = (prev[parent as keyof CreateItemDTO] as any) || {};
                return { ...prev, [parent]: { ...parentObj, [child]: value } };
            });
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
        if (field === 'name' && typeof value === 'string') setSearchTerm(value);
    };

    const generateInternalBatch = () => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const code = `INT-${dateStr}-${randomSuffix}`;
        handleChange('lotNumber', code);
        addToast('Lote Gerado', 'success', code);
    };

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

    const handleCasSearch = async () => {
        if (!formData.casNumber || formData.casNumber.length < 4) {
            addToast('Atenção', 'warning', 'Digite um número CAS válido.');
            return;
        }
        setIsCasLoading(true);
        try {
            const data = await CasApiService.fetchChemicalData(formData.casNumber);
            if (data) {
                setCasResult(data);
                const suggestedRisks = CasApiService.analyzeRisks(data);
                setFormData(prev => ({
                    ...prev,
                    name: !prev.name ? sanitizeProductName(CasApiService.formatName(data.name)) : prev.name, 
                    risks: { ...prev.risks, ...suggestedRisks } as RiskFlags,
                    molecularFormula: data.molecularFormula,
                    molecularWeight: data.molecularMass
                }));
                if(!formData.name) setSearchTerm(data.name);
                addToast('Dados Encontrados', 'success', `CAS: ${data.rn}`);
            } else {
                addToast('Não Encontrado', 'info', 'CAS não localizado.');
            }
        } catch (e) {
            addToast('Erro', 'error', 'Falha ao buscar dados CAS.');
        } finally {
            setIsCasLoading(false);
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;
        if (!formData.name?.trim()) { newErrors.name = 'Nome é obrigatório.'; isValid = false; }
        if (!formData.category?.trim()) { newErrors.category = 'Selecione uma categoria.'; isValid = false; }
        if (!formData.baseUnit?.trim()) { newErrors.baseUnit = 'Unidade é obrigatória.'; isValid = false; }
        if (!formData.location?.warehouse?.trim()) { newErrors['location.warehouse'] = 'Local é obrigatório.'; isValid = false; }
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            addToast('Campos Obrigatórios', 'warning', 'Verifique os campos em vermelho.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            // Garantia final de lote
            let finalLotNumber = formData.lotNumber;
            if (!finalLotNumber || finalLotNumber.trim() === '') {
                if (itemType !== 'EQUIPMENT') {
                    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                    finalLotNumber = `INT-${dateStr}-${randomSuffix}`;
                } else {
                    finalLotNumber = 'S/N';
                }
            }

            await onSubmit({ 
                ...formData, 
                lotNumber: finalLotNumber,
                itemType 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full relative" autoComplete="off">
            {/* TYPE TABS */}
            <div className="flex flex-wrap gap-2 w-full pb-2 mb-2 overflow-x-auto no-scrollbar">
                {(Object.entries(TYPE_CONFIG) as [ItemType, typeof TYPE_CONFIG[ItemType]][]).map(([key, config]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => handleTypeChange(key)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border
                            ${itemType === key 
                                ? `${config.activeClass} border-transparent` 
                                : 'bg-white dark:bg-slate-800 text-text-secondary dark:text-gray-400 border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-700'
                            }
                        `}
                    >
                        <span className="material-symbols-outlined text-[18px]">{config.icon}</span>
                        {config.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* ESQUERDA */}
                <div className="flex flex-col gap-6">
                    {/* CARD: DEFINIÇÃO DO PRODUTO */}
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
                                    onChange={e => handleChange('name', e.target.value)}
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
                                >
                                    <option value="" disabled>Selecione...</option>
                                    {getCategoriesByType(itemType).map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="Outros">Outros</option>
                                </Select>
                                <Input 
                                    label="Unidade (Base)"
                                    required
                                    value={formData.baseUnit || ''} 
                                    onChange={e => handleChange('baseUnit', e.target.value)}
                                    error={errors.baseUnit}
                                    placeholder="Ex: UN, L, kg"
                                />
                            </div>

                            <div className="flex gap-2 items-end">
                                <Input 
                                    containerClassName="flex-1"
                                    label="Código SAP / SKU"
                                    value={formData.sapCode || ''} 
                                    onChange={e => handleChange('sapCode', e.target.value)}
                                    placeholder="Opcional"
                                />
                                {onScan && (
                                    <Button 
                                        type="button" 
                                        onClick={() => onScan('sapCode')} 
                                        variant="ghost" 
                                        className="mb-0.5 text-text-secondary hover:text-primary border border-border-light dark:border-border-dark"
                                        title="Escanear Código de Barras"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* CARD: DADOS QUÍMICOS (Conditional) */}
                    {itemType === 'REAGENT' && (
                        <Card noBorder className="shadow-sm border border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10" padding="p-5">
                            <div className="flex items-center gap-2 mb-4 border-b border-red-200 dark:border-red-800 pb-2">
                                <span className="material-symbols-outlined text-red-500 text-[20px]">science</span> 
                                <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Dados Químicos (GHS)</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2 items-end">
                                    <Input 
                                        containerClassName="flex-1"
                                        label="CAS Number"
                                        value={formData.casNumber || ''} 
                                        onChange={e => handleChange('casNumber', e.target.value)}
                                        placeholder="Ex: 67-64-1"
                                        isLoading={isCasLoading}
                                    />
                                    <Button type="button" onClick={handleCasSearch} disabled={isCasLoading} variant="secondary" className="mb-0.5 bg-red-100 text-red-700 hover:bg-red-200 border-none">
                                        <span className="material-symbols-outlined">search</span>
                                    </Button>
                                </div>

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

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Riscos Associados</label>
                                    <div className="flex flex-wrap gap-2">
                                        {GHS_OPTIONS.map((ghs) => {
                                            const isChecked = formData.risks?.[ghs.key] || false;
                                            return (
                                                <Tooltip key={ghs.key} content={ghs.label} position="top">
                                                    <div 
                                                        onClick={() => {
                                                            setFormData(p => ({
                                                                ...p,
                                                                risks: { ...p.risks, [ghs.key]: !isChecked } as RiskFlags
                                                            }));
                                                        }}
                                                        className={`cursor-pointer border rounded-lg size-8 flex items-center justify-center transition-all ${
                                                            isChecked 
                                                            ? 'bg-white border-red-500 shadow ring-1 ring-red-500' 
                                                            : 'bg-white/50 border-transparent hover:bg-white'
                                                        }`}
                                                    >
                                                        <span className={`material-symbols-outlined text-[18px] ${isChecked ? ghs.textColor : 'text-slate-300'}`}>{ghs.icon}</span>
                                                    </div>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* DIREITA */}
                <div className="flex flex-col gap-6 w-full">
                    {/* CARD: LOTE & VALIDADE */}
                    <Card noBorder className="shadow-sm border-2 border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-900/5 relative" padding="p-5">
                         <div className="flex items-center gap-2 mb-4 border-b border-blue-200 dark:border-blue-800 pb-2">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">layers</span> 
                            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Lote & Validade</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-end gap-2">
                                    <Input 
                                        containerClassName="flex-1"
                                        label={itemType === 'EQUIPMENT' ? "Patrimônio/Série" : "Lote / Série"}
                                        value={formData.lotNumber || ''} 
                                        onChange={e => handleChange('lotNumber', e.target.value)}
                                        error={errors.lotNumber}
                                        placeholder={itemType === 'EQUIPMENT' ? "Ex: PAT-001" : "Vazio p/ auto"}
                                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                                    />
                                    <Tooltip content="Gerar Lote Interno">
                                        <button 
                                            type="button"
                                            onClick={generateInternalBatch}
                                            className="mb-0.5 p-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">autorenew</span>
                                        </button>
                                    </Tooltip>
                                    {onScan && (
                                        <Tooltip content="Escanear Lote">
                                            <button 
                                                type="button" 
                                                onClick={() => onScan('lotNumber')} 
                                                className="mb-0.5 p-2 rounded bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                                            </button>
                                        </Tooltip>
                                    )}
                                </div>

                                {itemType !== 'EQUIPMENT' && (
                                    <Input 
                                        label="Validade"
                                        type="date"
                                        value={formData.expiryDate || ''} 
                                        onChange={e => handleChange('expiryDate', e.target.value)}
                                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                                    />
                                )}
                            </div>
                            
                            <Input 
                                label="Fabricante / Fornecedor"
                                value={formData.supplier || ''} 
                                onChange={e => handleChange('supplier', e.target.value)}
                                className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                            />
                            
                             <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Qtd Inicial"
                                    type="number" 
                                    step="0.001"
                                    min={0}
                                    value={formData.quantity} 
                                    onChange={e => handleChange('quantity', Number(e.target.value))}
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
                                    onChange={e => handleChange('minStockLevel', Number(e.target.value))}
                                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                                />
                            </div>
                        </div>
                    </Card>
                    
                    {/* CARD: ARMAZENAMENTO */}
                    <Card noBorder className="shadow-sm border border-border-light dark:border-border-dark" padding="p-5">
                        <div className="flex items-center gap-2 mb-4 border-b border-border-light dark:border-border-dark pb-2">
                            <span className="material-symbols-outlined text-text-secondary text-[20px]">location_on</span> 
                            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400">Armazenamento</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                 <Input 
                                    label="Armazém / Sala"
                                    required
                                    placeholder="Ex: Geral"
                                    value={formData.location?.warehouse || ''}
                                    onChange={e => handleChange('location.warehouse', e.target.value)}
                                    error={errors['location.warehouse']}
                                />
                                <Input 
                                    label="Armário / Geladeira"
                                    value={formData.location?.cabinet || ''}
                                    onChange={e => handleChange('location.cabinet', e.target.value)}
                                    placeholder="Ex: Inflamáveis"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Prateleira"
                                    value={formData.location?.shelf || ''}
                                    onChange={e => handleChange('location.shelf', e.target.value)}
                                />
                                <Input 
                                    label="Posição (Grid)"
                                    value={formData.location?.position || ''}
                                    onChange={e => handleChange('location.position', e.target.value)}
                                    placeholder="Ex: A1"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {isEditMode && initialData?.id && (
                <div className="mt-4 animate-fade-in w-full border-t border-border-light dark:border-border-dark pt-6">
                    <div className="flex items-center gap-2 mb-4">
                         <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                         <h3 className="text-base font-bold text-text-main dark:text-white">
                             Histórico de Lotes deste Produto
                         </h3>
                    </div>
                    <BatchList itemId={initialData.id!} onViewHistory={onViewBatchHistory} />
                </div>
            )}

            <div className="sticky bottom-0 z-10 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark py-4 -mx-1 px-1 flex justify-between gap-3 mt-auto">
                <div className="flex gap-2">
                    {onGenerateQR && isEditMode && (
                        <Button 
                            type="button" 
                            variant="white" 
                            icon="qr_code_2"
                            onClick={() => onGenerateQR(formData)}
                        >
                            Etiqueta
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel} type="button" disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" variant="primary" icon="save" isLoading={isSubmitting} className="shadow-md">
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
};