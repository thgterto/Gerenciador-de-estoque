import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import { Grid } from '@mui/material';
import { Input } from '../ui/Input';
import { StorageAddress } from '../../types';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface StorageInfoProps {
    location: StorageAddress;
    onChange: (field: string, value: string) => void;
    errors: Record<string, string>;
}

export const StorageInfo: React.FC<StorageInfoProps> = ({ location, onChange, errors }) => {
    return (
        <Card variant="outlined">
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                    <LocationOnIcon color="action" />
                    <Typography variant="subtitle2" fontWeight="bold" textTransform="uppercase" color="text.secondary">
                        Armazenamento
                    </Typography>
                </Box>

                <Stack spacing={3}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Input
                                label="Armazém / Sala"
                                required
                                placeholder="Ex: Geral"
                                value={location?.warehouse || ''}
                                onChange={e => onChange('location.warehouse', e.target.value)}
                                error={errors['location.warehouse']}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Input
                                label="Armário / Geladeira"
                                value={location?.cabinet || ''}
                                onChange={e => onChange('location.cabinet', e.target.value)}
                                placeholder="Ex: Inflamáveis"
                            />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Input
                                label="Prateleira"
                                value={location?.shelf || ''}
                                onChange={e => onChange('location.shelf', e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Input
                                label="Posição (Grid)"
                                value={location?.position || ''}
                                onChange={e => onChange('location.position', e.target.value)}
                                placeholder="Ex: A1"
                            />
                        </Grid>
                    </Grid>
                </Stack>
            </CardContent>
        </Card>
    );
};
