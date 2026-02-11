import React, { useState } from 'react';
import {
    TextField, MenuItem, FormControlLabel, Switch, Chip, Stack, Card, InputAdornment, ToggleButton, ToggleButtonGroup, Box, Typography, Collapse, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import Grid from '@mui/material/Grid';

interface InventoryFiltersProps {
    term: string;
    setTerm: (v: string) => void;
    catFilter: string;
    setCatFilter: (v: string) => void;
    locationFilter: string;
    setLocationFilter: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: any) => void;
    hideZeroStock: boolean;
    setHideZeroStock: (v: boolean) => void;
    uniqueLocations: string[];
    uniqueCategories: string[];
    getCategoryIcon: (cat: string) => string;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
    term, setTerm,
    catFilter, setCatFilter,
    locationFilter, setLocationFilter,
    statusFilter, setStatusFilter,
    hideZeroStock, setHideZeroStock,
    uniqueLocations,
    uniqueCategories,
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
             <Grid container spacing={2} alignItems="center">
                {/* Search Bar - Always Visible and takes main space */}
                <Grid size={{ xs: 12, md: 6, lg: 7 }}>
                    <TextField
                        placeholder="Buscar por Nome, SKU, CAS ou lote..."
                        value={term}
                        onChange={e => setTerm(e.target.value)}
                        fullWidth
                        hiddenLabel
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                        }}
                        size="small"
                        sx={{ bgcolor: 'background.default' }}
                    />
                </Grid>

                {/* Mobile Filter Toggle */}
                <Grid size={{ xs: 12, md: 6, lg: 5 }} container spacing={2} justifyContent="flex-end">
                     <Grid size={{ xs: 6, sm: 'auto' }}>
                        <ToggleButtonGroup
                            value={statusFilter}
                            exclusive
                            onChange={(_e, val) => val && setStatusFilter(val)}
                            size="small"
                            sx={{ height: 40, width: '100%' }}
                        >
                            <ToggleButton value="ALL" sx={{ flexGrow: 1 }}>Todos</ToggleButton>
                            <ToggleButton value="LOW_STOCK" sx={{ flexGrow: 1 }}>Baixo</ToggleButton>
                            <ToggleButton value="EXPIRED" sx={{ flexGrow: 1 }}>Vencidos</ToggleButton>
                        </ToggleButtonGroup>
                     </Grid>
                     <Grid size={{ xs: 6, sm: 'auto' }}>
                        <Button
                            variant={showAdvanced ? "contained" : "outlined"}
                            color="primary"
                            size="medium"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            startIcon={<FilterListIcon />}
                            sx={{ height: 40, width: '100%' }}
                        >
                            Filtros
                        </Button>
                     </Grid>
                </Grid>
             </Grid>

             <Collapse in={showAdvanced}>
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextField
                                select
                                label="Localização"
                                value={locationFilter}
                                onChange={e => setLocationFilter(e.target.value)}
                                size="small"
                                fullWidth
                            >
                                <MenuItem value="">Todas Localizações</MenuItem>
                                {uniqueLocations.map(loc => (
                                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                             <FormControlLabel
                                control={<Switch checked={hideZeroStock} onChange={(e) => setHideZeroStock(e.target.checked)} />}
                                label={<Typography variant="body2" color="text.secondary">Ocultar itens sem estoque</Typography>}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" mb={1} display="block">CATEGORIAS:</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                            {uniqueCategories.map((cat) => (
                                <Chip
                                    key={cat}
                                    label={cat || 'Todas'}
                                    onClick={() => setCatFilter(cat)}
                                    variant={catFilter === cat ? 'filled' : 'outlined'}
                                    color={catFilter === cat ? 'primary' : 'default'}
                                    size="small"
                                    clickable
                                    sx={{ mb: 1 }}
                                />
                            ))}
                        </Stack>
                    </Box>
                </Box>
             </Collapse>
        </Card>
    );
};
