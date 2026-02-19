import React from 'react';
import {
    TextField, MenuItem, FormControlLabel, Switch, Chip, Stack, Card, InputAdornment, ToggleButton, ToggleButtonGroup, Box, Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

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
    return (
        <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
             <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="start">
                <TextField
                    label="Busca Rápida"
                    placeholder="Nome, SKU, CAS ou lote..."
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    fullWidth
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                    }}
                    size="small"
                />

                <Box>
                    <Typography variant="caption" fontWeight="bold" display="block" mb={0.5} color="text.secondary">STATUS</Typography>
                    <ToggleButtonGroup
                        value={statusFilter}
                        exclusive
                        onChange={(_e, val) => val && setStatusFilter(val)}
                        size="small"
                        sx={{ height: 40 }}
                    >
                        <ToggleButton value="ALL">Todos</ToggleButton>
                        <ToggleButton value="LOW_STOCK">Baixo</ToggleButton>
                        <ToggleButton value="EXPIRED">Vencidos</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <TextField
                    select
                    label="Localização"
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    sx={{ minWidth: 200 }}
                    size="small"
                    fullWidth
                >
                    <MenuItem value="">Todas Localizações</MenuItem>
                    {uniqueLocations.map(loc => (
                        <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                    ))}
                </TextField>
             </Stack>

             <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <FormControlLabel
                    control={<Switch checked={hideZeroStock} onChange={(e) => setHideZeroStock(e.target.checked)} />}
                    label={<Typography variant="body2" color="text.secondary">Ocultar itens sem estoque</Typography>}
                />

                <Box sx={{ height: 24, width: 1, bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }} />

                <Stack direction="row" spacing={1} alignItems="center" overflow="auto" pb={0.5} sx={{ width: '100%' }}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" noWrap>FILTRO RÁPIDO:</Typography>
                    {uniqueCategories.map((cat) => (
                         <Chip
                            key={cat}
                            label={cat || 'Todas'}
                            onClick={() => setCatFilter(cat)}
                            variant={catFilter === cat ? 'filled' : 'outlined'}
                            color={catFilter === cat ? 'primary' : 'default'}
                            size="small"
                            clickable
                         />
                    ))}
                </Stack>
             </Stack>
        </Card>
    );
};
