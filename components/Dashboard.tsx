import React, { useMemo } from 'react';
import {
    Card, CardContent, CardHeader, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Divider, useTheme
} from '@mui/material';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import Chart from 'react-apexcharts';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, MovementRecord } from '../types';
import { formatDate, formatDateTime } from '../utils/formatters';

// Icons - Sharp/Filled versions preferred for Brutalist look
import Inventory2SharpIcon from '@mui/icons-material/Inventory2Sharp';
import PaymentsSharpIcon from '@mui/icons-material/PaymentsSharp';
import WarningSharpIcon from '@mui/icons-material/WarningSharp';
import EventBusySharpIcon from '@mui/icons-material/EventBusySharp';
import HistorySharpIcon from '@mui/icons-material/HistorySharp';
import ArrowForwardSharpIcon from '@mui/icons-material/ArrowForwardSharp';
import AddShoppingCartSharpIcon from '@mui/icons-material/AddShoppingCartSharp';

interface DashboardProps {
  items: InventoryItem[];
  history: MovementRecord[];
  onAddToPurchase: (item: InventoryItem, reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL') => void;
  onAddStock: (item: InventoryItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ items, history, onAddToPurchase, onAddStock: _onAddStock }) => {
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

  // Chart Configuration - Precision Technical
  const commonChartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
        toolbar: { show: false },
        background: 'transparent',
        fontFamily: '"JetBrains Mono", monospace', // Technical font for charts
        animations: { enabled: true, speed: 800 }
    },
    colors: [theme.palette.primary.main, theme.palette.secondary.main],
    grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 0, // Solid sharp lines
        xaxis: { lines: { show: true } }
    },
    stroke: {
        width: 2,
        curve: 'straight' // No smoothing, raw data
    },
    tooltip: {
        theme: theme.palette.mode,
        style: { fontFamily: '"JetBrains Mono", monospace' }
    }
  }), [theme]);

  const paretoOptions: ApexCharts.ApexOptions = useMemo(() => ({
    ...commonChartOptions,
    chart: { ...commonChartOptions.chart, type: 'line' },
    colors: [theme.palette.primary.main, theme.palette.secondary.main],
    stroke: { width: [0, 2], curve: 'straight' },
    plotOptions: {
      bar: { columnWidth: '50%', borderRadius: 0 } // Sharp bars
    },
    dataLabels: { enabled: false },
    xaxis: {
        categories: paretoData.map((d: any) => d.category),
        labels: {
            style: {
                colors: theme.palette.text.secondary,
                fontFamily: '"JetBrains Mono", monospace'
            }
        }
    },
    yaxis: [
      {
          title: { text: 'VALOR (R$)', style: { fontFamily: '"Space Grotesk", sans-serif' } },
          labels: { formatter: (val) => val.toFixed(0) }
      },
      {
          opposite: true,
          title: { text: 'ACUMULADO %', style: { fontFamily: '"Space Grotesk", sans-serif' } },
          max: 100
      }
    ],
    legend: { position: 'top', fontFamily: '"Space Grotesk", sans-serif' }
  }), [commonChartOptions, paretoData, theme]);

  const paretoSeries = useMemo(() => [
    { name: 'Valor (R$)', type: 'column', data: paretoData.map((d: any) => d.value) },
    { name: '% Acumulado', type: 'line', data: paretoData.map((d: any) => d.accumulatedPercentage) }
  ], [paretoData]);

  return (
    <PageContainer scrollable>
      <PageHeader
          title="DASHBOARD"
          description={`STATUS DO SISTEMA: ${items.length > 0 ? 'OPERACIONAL' : 'INICIANDO'}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Metric Cards with Staggered Animation */}
        <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
             <MetricCard
                title="TOTAL DE ITENS"
                value={totalItems}
                icon={<Inventory2SharpIcon />}
                color="primary"
                onClick={() => navigate('/inventory')}
             />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
             <MetricCard
                title="VALOR EM ESTOQUE"
                value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={<PaymentsSharpIcon />}
                color="success" // Emerald
             />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
             <MetricCard
                title="BAIXO ESTOQUE"
                value={lowStockItems.length}
                subtitle={outOfStockItems.length > 0 ? `${outOfStockItems.length} ZERADOS` : undefined}
                icon={<WarningSharpIcon />}
                color="warning" // Amber
             />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
             <MetricCard
                title="A VENCER"
                value={expiringItems.length}
                icon={<EventBusySharpIcon />}
                color="error" // Red
             />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
        {/* Recent Transactions */}
        <div className="lg:col-span-2 h-full">
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                    title={<Typography variant="h6" fontWeight="bold" letterSpacing={1}>MOVIMENTAÇÕES RECENTES</Typography>}
                    avatar={<HistorySharpIcon color="action" />}
                    action={
                        <Button
                            size="small"
                            endIcon={<ArrowForwardSharpIcon />}
                            onClick={() => navigate('/history')}
                            sx={{ fontFamily: '"JetBrains Mono", monospace' }}
                        >
                            VER LOG
                        </Button>
                    }
                    sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5 }}
                />
                <TableContainer sx={{ flexGrow: 1 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>TIPO</TableCell>
                                <TableCell>ITEM / LOTE</TableCell>
                                <TableCell align="right">QTD</TableCell>
                                <TableCell align="right">DATA/HORA</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recentTransactions.map((tx) => (
                                <TableRow key={tx.id} hover>
                                    <TableCell>
                                        <Chip
                                            label={tx.type}
                                            size="small"
                                            // Using custom colors or mapping to success/warning/default
                                            color={tx.type === 'ENTRADA' ? 'success' : tx.type === 'SAIDA' ? 'default' : 'warning'}
                                            variant="filled" // Solid filled chips for brutalist look
                                            sx={{ borderRadius: 0, fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontFamily='"Inter", sans-serif' fontWeight={600}>{tx.productName}</Typography>
                                        <Typography variant="caption" color="textSecondary" fontFamily='"JetBrains Mono", monospace'>ID: {tx.lot}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontFamily='"JetBrains Mono", monospace' fontWeight="bold">
                                            {tx.quantity} <Typography component="span" variant="caption">{tx.unit}</Typography>
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="caption" fontFamily='"JetBrains Mono", monospace'>{formatDateTime(tx.date)}</Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {recentTransactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Typography variant="body2" color="textSecondary" sx={{ py: 4, fontFamily: '"JetBrains Mono", monospace' }}>
                                            [SEM DADOS DE LOG]
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </div>

        {/* Action Items & Charts */}
        <div className="lg:col-span-1 space-y-6">

            {/* Action Items */}
            <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
                <CardHeader
                    title={<Typography variant="subtitle1" fontWeight="bold">AÇÃO NECESSÁRIA</Typography>}
                    action={
                        (lowStockItems.length + expiringItems.length) > 0 &&
                        <Chip
                            label={lowStockItems.length + expiringItems.length}
                            color="error"
                            size="small"
                            sx={{ borderRadius: 0 }}
                        />
                    }
                    sx={{ py: 1 }}
                />
                <Divider />
                <CardContent sx={{ pt: 2, maxHeight: 400, overflowY: 'auto' }}>
                        {/* Low Stock */}
                        {lowStockItems.slice(0, 3).map(item => (
                        <Box key={item.id} sx={{ mb: 2, p: 1.5, bgcolor: 'warning.light', border: '1px solid', borderColor: 'warning.main', color: 'warning.contrastText' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" noWrap sx={{ maxWidth: '70%', fontFamily: '"Inter", sans-serif' }}>{item.name}</Typography>
                                <Typography variant="caption" fontFamily='"JetBrains Mono", monospace' fontWeight="bold">{item.quantity} / {item.minStockLevel} {item.baseUnit}</Typography>
                            </Box>
                            <Button
                                size="small"
                                variant="outlined" // Outlined for contrast on colored bg
                                color="inherit"
                                fullWidth
                                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)' }}
                                onClick={() => onAddToPurchase(item, 'LOW_STOCK')}
                                startIcon={<AddShoppingCartSharpIcon />}
                            >
                                REPOR ESTOQUE
                            </Button>
                        </Box>
                        ))}

                        {/* Expiring */}
                        {expiringItems.slice(0, 3).map(item => (
                        <Box key={item.id} sx={{ mb: 2, p: 1.5, bgcolor: 'error.light', border: '1px solid', borderColor: 'error.main', color: 'error.contrastText' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" noWrap sx={{ maxWidth: '70%' }}>{item.name}</Typography>
                                <Typography variant="caption" fontFamily='"JetBrains Mono", monospace' fontWeight="bold">VENCE: {formatDate(item.expiryDate)}</Typography>
                            </Box>
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                fullWidth
                                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)' }}
                                onClick={() => onAddToPurchase(item, 'EXPIRING')}
                                startIcon={<AddShoppingCartSharpIcon />}
                            >
                                REPOR (VENCIMENTO)
                            </Button>
                        </Box>
                        ))}

                        {(lowStockItems.length === 0 && expiringItems.length === 0) && (
                        <Typography variant="body2" color="textSecondary" align="center" fontFamily='"JetBrains Mono", monospace'>
                            [SISTEMA OK]
                        </Typography>
                        )}
                </CardContent>
            </Card>

            {/* Pareto Chart */}
            <Card>
                <CardHeader title={<Typography variant="subtitle1" fontWeight="bold">ANÁLISE PARETO (ABC)</Typography>} sx={{ py: 1.5 }} />
                <Divider />
                <CardContent>
                    <Box sx={{ height: 280 }}>
                        <Chart options={paretoOptions} series={paretoSeries} type="line" height="100%" />
                    </Box>
                </CardContent>
            </Card>
        </div>
      </div>
    </PageContainer>
  );
};

const MetricCard = ({ title, value, icon, color, onClick, subtitle }: any) => (
    <Card
      sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          transition: 'transform 0.2s',
          '&:hover': onClick ? { transform: 'translateY(-2px)' } : {}
      }}
      onClick={onClick}
      elevation={0} // Flat
      variant="outlined" // Sharp border
    >
        <CardContent sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: 2 }}>
            <Box>
                <Typography color="textSecondary" variant="overline" display="block" sx={{ lineHeight: 1.2, mb: 1 }}>
                    {title}
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold" fontFamily='"JetBrains Mono", monospace' sx={{ letterSpacing: '-0.05em' }}>
                    {value}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontFamily: '"JetBrains Mono", monospace' }}>
                        [{subtitle}]
                    </Typography>
                )}
            </Box>
            <Box sx={{
                color: `${color}.main`,
                p: 1,
                border: '1px solid',
                borderColor: `${color}.light`,
                bgcolor: `${color}.light`, // Solid background for icon
                display: 'flex',
                borderRadius: 0 // Sharp icon box
            }}>
                {icon}
            </Box>
        </CardContent>
    </Card>
);
