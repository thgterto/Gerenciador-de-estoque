
import { useState, useEffect } from 'react';
import { CreateItemDTO, ItemType, InventoryItem, RiskFlags } from '../types';
import { useAlert } from '../context/AlertContext';

const INITIAL_RISKS: RiskFlags = {
    O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false,
    GHS01: false, GHS02: false, GHS03: false, GHS04: false, GHS05: false, GHS06: false, GHS07: false, GHS08: false, GHS09: false
};

interface UseItemFormProps {
    initialData?: Partial<InventoryItem>;
    onSubmit: (data: any) => Promise<void>;
}

export const useItemForm = ({ initialData, onSubmit }: UseItemFormProps) => {
    const { addToast } = useAlert();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Default State
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

    const [itemType, setItemType] = useState<ItemType>(initialData?.itemType || 'REAGENT');

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
            if (initialData.itemType) setItemType(initialData.itemType);
            else if (initialData.molecularFormula || initialData.casNumber) setItemType('REAGENT');
        }
    }, [initialData]);

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
    };

    const handleTypeChange = (type: ItemType) => {
        setItemType(type);
        setFormData(prev => ({ ...prev, itemType: type, category: '' }));
        setErrors({});
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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validate()) {
            addToast('Campos Obrigatórios', 'warning', 'Verifique os campos em vermelho.');
            return;
        }

        setIsSubmitting(true);
        try {
            let finalLotNumber = formData.lotNumber;
            // Auto-generate logic for internal IDs if empty
            if (!finalLotNumber || finalLotNumber.trim() === '') {
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                if (itemType === 'EQUIPMENT') {
                    finalLotNumber = `EQ-${dateStr}-${randomSuffix}`;
                } else {
                    finalLotNumber = `INT-${dateStr}-${randomSuffix}`;
                }
            }

            await onSubmit({
                ...formData,
                lotNumber: finalLotNumber,
                itemType
            });
        } catch (error) {
            console.error(error);
            addToast('Erro', 'error', 'Falha ao salvar item.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        itemType,
        setItemType,
        handleChange,
        handleTypeChange,
        handleSubmit,
        isSubmitting
    };
};
