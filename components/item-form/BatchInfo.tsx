import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip, Stack } from '@mui/material';
import { Grid } from '@mui/material';
import { Input } from '../ui/Input';
import { CreateItemDTO, ItemType } from '../../types';
import LayersIcon from '@mui/icons-material/Layers';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

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
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                    <LayersIcon color="primary" />
                    <Typography variant="subtitle2" fontWeight="bold" textTransform="uppercase" color="primary">
                        Lote & Validade
                    </Typography>
                </Box>

                <Stack spacing={3}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Input
                                label={itemType === 'EQUIPMENT' ? "Patrimônio/Série" : "Lote / Série"}
                                value={formData.lotNumber || ''}
                                onChange={e => onChange('lotNumber', e.target.value)}
                                error={errors.lotNumber}
                                placeholder={itemType === 'EQUIPMENT' ? "Ex: PAT-001" : "Vazio p/ auto"}
                                rightElement={
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title="Gerar Lote Interno">
                                            <IconButton onClick={onGenerateInternalBatch} size="small">
                                                <AutorenewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {onScan && (
                                            <Tooltip title="Escanear">
                                                <IconButton onClick={() => onScan('lotNumber')} size="small">
                                                    <QrCodeScannerIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                }
                            />
                        </Grid>
                        {itemType !== 'EQUIPMENT' && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Input
                                    label="Validade"
                                    type="date"
                                    value={formData.expiryDate || ''}
                                    onChange={e => onChange('expiryDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        )}
                    </Grid>

                    <Input
                        label="Fabricante / Fornecedor"
                        value={formData.supplier || ''}
                        onChange={e => onChange('supplier', e.target.value)}
                    />

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Input
                                label="Qtd Inicial"
                                type="number"
                                inputProps={{ step: "0.001", min: 0 }}
                                value={String(formData.quantity ?? 0)}
                                onChange={e => onChange('quantity', Number(e.target.value))}
                                error={errors.quantity}
                                disabled={isEditMode}
                                helpText={isEditMode ? "Use 'Movimentar' para alterar." : ""}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Input
                                label="Estoque Mínimo"
                                type="number"
                                inputProps={{ step: "1", min: 0 }}
                                value={String(formData.minStockLevel ?? 0)}
                                onChange={e => onChange('minStockLevel', Number(e.target.value))}
                            />
                        </Grid>
                    </Grid>
                </Stack>
            </CardContent>
        </Card>
    );
};
