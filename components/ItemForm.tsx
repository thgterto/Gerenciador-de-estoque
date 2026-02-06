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
import { Box, Typography, Stack, Paper, List, ListItemButton, ListItemText, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { Grid } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ScienceIcon from '@mui/icons-material/Science';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';

interface ItemFormProps {
    initialData?: Partial<InventoryItem>;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    submitLabel?: string;
    onViewBatchHistory?: (batchId: string) => void;
    onScan?: (field: keyof CreateItemDTO) => void;
    onGenerateQR?: (itemData: Partial<InventoryItem>) => void;
}

const INITIAL_RISKS: RiskFlags = {
    O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false,
    GHS01: false, GHS02: false, GHS03: false, GHS04: false, GHS05: false, GHS06: false, GHS07: false, GHS08: false, GHS09: false
};

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

    // Initialize Search Term
    useEffect(() => {
        if (initialData?.name) setSearchTerm(initialData.name);
    }, [initialData]);

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
            <Stack spacing={3} pb={10}>
                <TypeSelector currentType={itemType} onChange={handleTypeChange} />

                <Grid container spacing={3}>
                    {/* COLUNA ESQUERDA: DADOS BÁSICOS */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={3}>
                            <Card variant="outlined">
                                <Box p={2} borderBottom={1} borderColor="divider" display="flex" alignItems="center" gap={1}>
                                    <Inventory2Icon color="action" />
                                    <Typography variant="subtitle2" fontWeight="bold" textTransform="uppercase" color="text.secondary">
                                        Definição do Produto
                                    </Typography>
                                </Box>
                                <Box p={2}>
                                    <Stack spacing={2}>
                                        <Box position="relative" ref={suggestionsRef}>
                                            <Input
                                                label="Nome do Item"
                                                required
                                                value={formData.name || ''}
                                                onChange={e => handleNameChange(e.target.value)}
                                                error={errors.name}
                                                placeholder={itemType === 'REAGENT' ? "Ex: Ácido Sulfúrico" : "Nome do item"}
                                            />
                                            {showSuggestions && suggestions.length > 0 && (
                                                <Paper sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, mt: 0.5 }} elevation={3}>
                                                    <List dense>
                                                        {suggestions.map((item) => (
                                                            <ListItemButton key={item.id} onClick={() => selectSuggestion(item)}>
                                                                <ListItemText
                                                                    primary={item.name}
                                                                    secondary={item.sapCode}
                                                                    primaryTypographyProps={{ fontWeight: 'medium' }}
                                                                />
                                                            </ListItemButton>
                                                        ))}
                                                    </List>
                                                </Paper>
                                            )}
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6 }}>
                                                <Select
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
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Input
                                                    label="Unidade (Base)"
                                                    required
                                                    value={formData.baseUnit || ''}
                                                    onChange={e => handleChange('baseUnit', e.target.value)}
                                                    error={errors.baseUnit}
                                                    placeholder="Ex: UN, L, kg"
                                                />
                                            </Grid>
                                        </Grid>

                                        <Input
                                            label="Código SAP / SKU"
                                            value={formData.sapCode || ''}
                                            onChange={e => handleChange('sapCode', e.target.value)}
                                            placeholder="Opcional"
                                            rightElement={
                                                onScan && (
                                                    <IconButton size="small" onClick={() => onScan('sapCode')}>
                                                        <QrCodeScannerIcon fontSize="small" />
                                                    </IconButton>
                                                )
                                            }
                                        />
                                    </Stack>
                                </Box>
                            </Card>

                            {itemType === 'REAGENT' && (
                                <Card variant="outlined" sx={{ borderColor: 'error.main', bgcolor: 'error.lighter' }}>
                                    <Box p={2} borderBottom={1} borderColor="error.main" display="flex" alignItems="center" gap={1}>
                                        <ScienceIcon color="error" />
                                        <Typography variant="subtitle2" fontWeight="bold" textTransform="uppercase" color="error.main">
                                            Dados Químicos (GHS)
                                        </Typography>
                                    </Box>
                                    <Box p={2}>
                                        <Stack spacing={2}>
                                            <Input
                                                label="CAS Number"
                                                value={formData.casNumber || ''}
                                                onChange={e => handleChange('casNumber', e.target.value)}
                                                placeholder="Ex: 67-64-1"
                                                isLoading={isCasLoading}
                                                rightElement={
                                                    <IconButton size="small" onClick={onCasSearch} disabled={isCasLoading}>
                                                        <SearchIcon fontSize="small" />
                                                    </IconButton>
                                                }
                                            />

                                            {casResult && (
                                                <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                                                    <Box
                                                        component="img"
                                                        src={`https://commonchemistry.cas.org/api/image?cas_rn=${CasApiService.normalizeCas(formData.casNumber || '')}`}
                                                        sx={{ width: 48, height: 48, objectFit: 'contain', bgcolor: 'white', borderRadius: 1, border: 1, borderColor: 'divider' }}
                                                        onError={(e: any) => e.currentTarget.style.display = 'none'}
                                                    />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight="bold">{casResult.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {casResult.molecularFormula} • MW: {casResult.molecularMass}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            )}

                                            <RiskSelector
                                                risks={formData.risks || INITIAL_RISKS}
                                                onChange={(r) => handleChange('risks', r)}
                                            />
                                        </Stack>
                                    </Box>
                                </Card>
                            )}
                        </Stack>
                    </Grid>

                    {/* COLUNA DIREITA: LOGÍSTICA */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={3}>
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
                        </Stack>
                    </Grid>
                </Grid>

                {/* BATCH HISTORY (EDIT MODE ONLY) */}
                {isEditMode && initialData?.id && (
                    <Card variant="outlined">
                        <Box p={2} borderBottom={1} borderColor="divider" display="flex" alignItems="center" gap={1}>
                            <HistoryIcon color="primary" />
                            <Typography variant="subtitle2" fontWeight="bold">
                                Histórico de Lotes deste Produto
                            </Typography>
                        </Box>
                        <Box p={2}>
                            <BatchList itemId={initialData.id!} onViewHistory={onViewBatchHistory} />
                        </Box>
                    </Card>
                )}
            </Stack>

            {/* Sticky Footer */}
            <Paper
                elevation={3}
                sx={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    p: 2, zIndex: 100,
                    borderTop: 1, borderColor: 'divider',
                    display: 'flex', justifyContent: 'space-between'
                }}
            >
                <Box>
                    {onGenerateQR && isEditMode && (
                        <Button 
                            variant="outlined"
                            startIcon={<QrCode2Icon />}
                            onClick={() => onGenerateQR(formData)}
                            sx={{ display: { xs: 'none', sm: 'flex' } }}
                        >
                            Etiqueta
                        </Button>
                    )}
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="text" onClick={onCancel} disabled={isSubmitting} startIcon={<CloseIcon />}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        isLoading={isSubmitting}
                    >
                        {submitLabel}
                    </Button>
                </Stack>
            </Paper>
        </form>
    );
};
