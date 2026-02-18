import React from 'react';
import { RiskFlags } from '../../types';
import { GHS_OPTIONS } from '../../utils/businessRules';
import { Tooltip, Stack, Typography, Box } from '@mui/material';

interface RiskSelectorProps {
    risks: RiskFlags;
    onChange: (risks: RiskFlags) => void;
}

export const RiskSelector: React.FC<RiskSelectorProps> = ({ risks, onChange }) => {

    const toggleRisk = (key: keyof RiskFlags) => {
        onChange({ ...risks, [key]: !risks[key] });
    };

    return (
        <Box>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" display="block" mb={1}>
                Riscos Associados (GHS)
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {GHS_OPTIONS.map((ghs) => {
                    const isChecked = risks?.[ghs.key] || false;
                    return (
                        <Tooltip key={ghs.key} title={ghs.label} arrow>
                            <Box
                                onClick={() => toggleRisk(ghs.key)}
                                sx={{
                                    width: 36, height: 36,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: isChecked ? 'error.main' : 'divider',
                                    bgcolor: isChecked ? 'error.light' : 'background.paper',
                                    color: isChecked ? 'error.contrastText' : 'text.disabled',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'error.main',
                                        color: 'error.main'
                                    }
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{ghs.icon}</span>
                            </Box>
                        </Tooltip>
                    );
                })}
            </Stack>
        </Box>
    );
};
