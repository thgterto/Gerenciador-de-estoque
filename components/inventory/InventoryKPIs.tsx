import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Grid } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarningIcon from '@mui/icons-material/Warning';
import EventBusyIcon from '@mui/icons-material/EventBusy';

interface InventoryStats {
    totalItems: number;
    lowStockCount: number;
    expiredCount: number;
}

interface InventoryKPIsProps {
    stats: InventoryStats;
}

export const InventoryKPIs: React.FC<InventoryKPIsProps> = ({ stats }) => {
    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
             <Grid size={{ xs: 12, sm: 4 }}>
                 <MetricCard
                    title="Itens Ativos"
                    icon={<Inventory2Icon fontSize="large" />}
                    value={stats.totalItems}
                    subValue="Lotes totais"
                    color="primary"
                 />
             </Grid>
             <Grid size={{ xs: 12, sm: 4 }}>
                 <MetricCard
                    title="Baixo Estoque"
                    icon={<WarningIcon fontSize="large" />}
                    value={stats.lowStockCount}
                    subValue="Requer atenção"
                    color="warning"
                 />
             </Grid>
             <Grid size={{ xs: 12, sm: 4 }}>
                 <MetricCard
                    title="Vencidos"
                    icon={<EventBusyIcon fontSize="large" />}
                    value={stats.expiredCount}
                    subValue="Descartar"
                    color="error"
                 />
             </Grid>
        </Grid>
    );
};

const MetricCard = ({ title, icon, value, subValue, color }: any) => (
    <Card sx={{ height: '100%' }} variant="outlined">
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
            <Box>
                <Typography variant="overline" color="text.secondary" fontWeight="bold">
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                    {value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {subValue}
                </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main` }}>
                {icon}
            </Box>
        </CardContent>
    </Card>
);
