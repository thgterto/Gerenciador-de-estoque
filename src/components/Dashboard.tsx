import React from 'react';
import {
    Card, CardContent, CardHeader, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Divider, useTheme
} from '@mui/material';
import { Grid } from '@mui/material';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import Chart from 'react-apexcharts';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, MovementRecord } from '../types';
import { formatDate, formatDateTime } from '../utils/formatters';

// Icons
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PaymentsIcon from '@mui/icons-material/Payments';
import WarningIcon from '@mui/icons-material/Warning';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

interface DashboardProps {
  items: InventoryItem[];
  history: MovementRecord[];
  onAddToPurchase: (item: InventoryItem, reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ items, history, onAddToPurchase }) => {
  const {
    totalItems,
    lowStockItems,
    outOfStockItems,
    expiringItems,
    totalValue,
    recentTransactions,
    paretoData
  } = useDashboardAnalytics(items, history);
  
  const navigate = useNavigate();
  const theme = useTheme();

  // Chart Configuration
  const commonChartOptions: ApexCharts.ApexOptions = {
    chart: {
        toolbar: { show: false },
        background: 'transparent',
        fontFamily: theme.typography.fontFamily
    },
    colors: [theme.palette.primary.main, theme.palette.secondary.main],
    grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 4,
    },
    tooltip: { theme: theme.palette.mode }
  };

  const paretoOptions: ApexCharts.ApexOptions = {
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: 'line' },
    colors: [theme.palette.primary.main, theme.palette.text.primary],
    stroke: { width: [0, 3], curve: 'smooth' },
    plotOptions: {
      bar: { columnWidth: '60%', borderRadius: 4 }
    },
    dataLabels: { enabled: false },
    xaxis: {
        categories: paretoData.map((d: { category: string }) => d.category),
        labels: { style: { colors: theme.palette.text.secondary } }
    },
    yaxis: [
      { title: { text: 'Valor Total' } },
      { opposite: true, title: { text: 'Acumulado %' }, max: 100 }
    ],
    legend: { position: 'top' }
  };

  const paretoSeries = [
    { name: 'Valor (R$)', type: 'column', data: paretoData.map((d: { value: number }) => d.value) },
    { name: '% Acumulado', type: 'line', data: paretoData.map((d: { accumulatedPercentage: number }) => d.accumulatedPercentage) }
  ];

  return (
    <PageContainer scrollable>
      <PageHeader
          title="Dashboard"
          description="Visão Geral Operacional"
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Metrics */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
             <MetricCard
                title="Total de Itens"
                value={totalItems}
                icon={<Inventory2Icon />}
                color="primary"
                onClick={() => navigate('/inventory')}
             />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
             <MetricCard
                title="Valor em Estoque"
                value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={<PaymentsIcon />}
                color="success"
             />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
             <MetricCard
                title="Baixo Estoque"
                value={lowStockItems.length}
                subtitle={outOfStockItems.length > 0 ? `${outOfStockItems.length} zerados` : undefined}
                icon={<WarningIcon />}
                color="warning"
             />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
             <MetricCard
                title="A Vencer"
                value={expiringItems.length}
                icon={<EventBusyIcon />}
                color="error"
             />
        </Grid>

        {/* Recent Transactions */}
        <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ height: '100%' }}>
                <CardHeader
                    title="Movimentações Recentes"
                    avatar={<HistoryIcon color="action" />}
                    action={
                        <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/history')}>
                            Ver Tudo
                        </Button>
                    }
                />
                <Divider />
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Item</TableCell>
                                <TableCell align="right">Qtd</TableCell>
                                <TableCell align="right">Data</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recentTransactions.map((tx) => (
                                <TableRow key={tx.id} hover>
                                    <TableCell>
                                        <Chip
                                            label={tx.type}
                                            size="small"
                                            color={tx.type === 'ENTRADA' ? 'success' : tx.type === 'SAIDA' ? 'default' : 'warning'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">{tx.productName}</Typography>
                                        <Typography variant="caption" color="textSecondary">Lote: {tx.lot}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold">
                                            {tx.quantity} <Typography component="span" variant="caption">{tx.unit}</Typography>
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="caption">{formatDateTime(tx.date)}</Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {recentTransactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                                            Nenhuma movimentação recente.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Grid>

        {/* Action Required & Charts */}
        <Grid size={{ xs: 12, lg: 4 }}>
            <Grid container spacing={3} direction="column">
                
                {/* Action Items */}
                <Grid size={{ xs: 12 }}>
                    <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
                        <CardHeader
                            title="Ação Necessária"
                            action={
                                (lowStockItems.length + expiringItems.length) > 0 &&
                                <Chip label={lowStockItems.length + expiringItems.length} color="error" size="small" />
                            }
                        />
                        <CardContent sx={{ pt: 0, maxHeight: 400, overflowY: 'auto' }}>
                             {/* Low Stock */}
                             {lowStockItems.slice(0, 3).map(item => (
                                <Box key={item.id} sx={{ mb: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.contrastText' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" noWrap sx={{ maxWidth: '70%' }}>{item.name}</Typography>
                                        <Typography variant="caption" fontWeight="bold">{item.quantity} / {item.minStockLevel} {item.baseUnit}</Typography>
                                    </Box>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="warning"
                                        fullWidth
                                        sx={{ mt: 1 }}
                                        onClick={() => onAddToPurchase(item, 'LOW_STOCK')}
                                        startIcon={<AddShoppingCartIcon />}
                                    >
                                        Repor Estoque
                                    </Button>
                                </Box>
                             ))}

                             {/* Expiring */}
                             {expiringItems.slice(0, 3).map(item => (
                                <Box key={item.id} sx={{ mb: 2, p: 1.5, bgcolor: 'error.light', borderRadius: 1, color: 'error.contrastText' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" noWrap sx={{ maxWidth: '70%' }}>{item.name}</Typography>
                                        <Typography variant="caption" fontWeight="bold">Vence: {formatDate(item.expiryDate)}</Typography>
                                    </Box>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="error"
                                        fullWidth
                                        sx={{ mt: 1 }}
                                        onClick={() => onAddToPurchase(item, 'EXPIRING')}
                                        startIcon={<AddShoppingCartIcon />}
                                    >
                                        Repor (Vencimento)
                                    </Button>
                                </Box>
                             ))}

                             {(lowStockItems.length === 0 && expiringItems.length === 0) && (
                                <Typography variant="body2" color="textSecondary" align="center">
                                    Tudo certo! Nenhuma ação pendente.
                                </Typography>
                             )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Pareto Chart */}
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardHeader title="Top Categorias (Pareto)" />
                        <CardContent>
                            <Box sx={{ height: 300 }}>
                                <Chart options={paretoOptions} series={paretoSeries} type="line" height="100%" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
    subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, onClick, subtitle }) => (
    <Card
      sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default', position: 'relative' }}
      onClick={onClick}
      elevation={2}
    >
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                    {title}
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold">
                    {value}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="error">
                        {subtitle}
                    </Typography>
                )}
            </Box>
            <Box sx={{
                bgcolor: `${color}.light`,
                color: `${color}.main`,
                p: 1.5,
                borderRadius: '50%',
                display: 'flex'
            }}>
                {icon}
            </Box>
        </CardContent>
    </Card>
);
