import React from 'react';
import { ItemType } from '../../types';
import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import InventoryIcon from '@mui/icons-material/Inventory';

interface TypeSelectorProps {
    currentType: ItemType;
    onChange: (type: ItemType) => void;
}

const TYPE_CONFIG: Record<ItemType, { label: string, icon: React.ReactNode }> = {
    'REAGENT': { label: 'Reagente', icon: <ScienceIcon fontSize="small" /> },
    'GLASSWARE': { label: 'Vidraria', icon: <BiotechIcon fontSize="small" /> },
    'EQUIPMENT': { label: 'Equipamento', icon: <PrecisionManufacturingIcon fontSize="small" /> },
    'SPARE_PART': { label: 'Peça Rep.', icon: <SettingsSuggestIcon fontSize="small" /> },
    'CONSUMABLE': { label: 'Consumível', icon: <InventoryIcon fontSize="small" /> },
};

export const TypeSelector: React.FC<TypeSelectorProps> = ({ currentType, onChange }) => {
    return (
        <Box sx={{ mb: 3, width: '100%', overflowX: 'auto', pb: 1 }}>
            <ToggleButtonGroup
                value={currentType}
                exclusive
                onChange={(e, val) => val && onChange(val)}
                aria-label="item type"
                size="small"
                fullWidth
            >
                {(Object.entries(TYPE_CONFIG) as [ItemType, typeof TYPE_CONFIG[ItemType]][]).map(([key, config]) => (
                    <ToggleButton key={key} value={key} sx={{ px: 2, py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {config.icon}
                            <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{config.label}</Box>
                        </Box>
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Box>
    );
};
