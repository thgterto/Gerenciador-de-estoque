import React, { useState, useMemo } from 'react';
import { InventoryItem, MovementRecord } from '../types';
import { PageHeader } from './ui/PageHeader';
import { PageContainer } from './ui/PageContainer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Box, Tabs, Tab, Typography, Grid, Paper, Stack } from '@mui/material';
import Chart from 'react-apexcharts';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';
import ScienceIcon from '@mui/icons-material/Science';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WarningIcon from '@mui/icons-material/Warning';
import PrintIcon from '@mui/icons-material/Print';
import SignalCellularNodataIcon from "@mui/icons-material/SignalCellularNodata";

interface ReportsProps {
  items: InventoryItem[];
  history: MovementRecord[];
}

const FlowChart: React.FC<{ labels: string[], dataIn: number[], dataOut: number[] }> = ({ labels, dataIn, dataOut }) => {
    const options: any = {
        chart: {
            id: 'flow-chart',
            toolbar: { show: false },
            fontFamily: 'inherit',
            background: 'transparent'
        },
        colors: ['#10b981', '#ef4444'],
        stroke: { curve: 'smooth', width: 3 },
        xaxis: {
            categories: labels,
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4,
        },
        dataLabels: { enabled: false },
        tooltip: { theme: 'dark' },
        legend: { position: 'top' }
    };

    return (
        <Chart
            options={options}
            series={[
                { name: 'Entradas', data: dataIn },
                { name: 'Saídas', data: dataOut }
            ]}
            type="area"
            height={320}
        />
    );
};

export const Reports: React.FC<ReportsProps> = ({ items, history }) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'FLOW' | 'CONTROLLED' | 'EXPIRY'>('GENERAL');

    const abcAnalysis = useMemo(() => {
        const sorted = [...items]
            .map(i => ({ ...i, value: i.quantity * i.unitCost }))
            .sort((a, b) => b.value - a.value);

        const totalValue = sorted.reduce((sum, i) => sum + i.value, 0);
        let accumulatedValue = 0;

        return sorted.map(i => {
            accumulatedValue += i.value;
            const percentage = (accumulatedValue / totalValue) * 100;
            let classification = 'C';
            if (percentage <= 80) classification = 'A';
            else if (percentage <= 95) classification = 'B';

            return { ...i, class: classification, percentage };
        }).filter(i => i.class === 'A' || i.class === 'B').slice(0, 50);
    }, [items]);

    const monthlyFlow = useMemo(() => {
        const months = [];
        const dataIn = [];
        const dataOut = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            months.push(monthLabel);

            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            const monthRecords = history.filter(r => {
                const rDate = new Date(r.date);
                return rDate >= start && rDate <= end;
            });

            const entrySum = monthRecords.filter(r => r.type === 'ENTRADA').reduce((acc, r) => acc + r.quantity, 0);
            const exitSum = monthRecords.filter(r => r.type === 'SAIDA').reduce((acc, r) => acc + r.quantity, 0);

            dataIn.push(entrySum);
            dataOut.push(exitSum);
        }

        return { labels: months, dataIn, dataOut };
    }, [history]);

    const controlledReport = useMemo(() => {
        return items
            .filter(i => i.isControlled)
            .map(i => {
                const itemHistory = history.filter(h => h.itemId === i.id || h.productName === i.name);
                const totalEntry = itemHistory.filter(h => h.type === 'ENTRADA').reduce((a, b) => a + b.quantity, 0);
                const totalExit = itemHistory.filter(h => h.type === 'SAIDA').reduce((a, b) => a + b.quantity, 0);
                return { ...i, totalEntry, totalExit };
            });
    }, [items, history]);

    const expiryRisk = useMemo(() => {
        const now = new Date();
        const ninetyDays = new Date();
        ninetyDays.setDate(now.getDate() + 90);

        return items
            .filter(i => i.expiryDate && new Date(i.expiryDate) <= ninetyDays)
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    }, [items]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <PageContainer scrollable>
            <PageHeader
                title="Relatórios & Inteligência"
                description="Análise detalhada de movimentação, riscos e curva ABC."
            />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} aria-label="report tabs">
                    <Tab label="Visão Geral (ABC)" value="GENERAL" icon={<AssessmentIcon />} iconPosition="start" />
                    <Tab label="Fluxo de Movimento" value="FLOW" icon={<TimelineIcon />} iconPosition="start" />
                    <Tab label="Controlados (Mapa)" value="CONTROLLED" icon={<ScienceIcon />} iconPosition="start" />
                    <Tab label="Risco Validade" value="EXPIRY" icon={<EventBusyIcon />} iconPosition="start" />
                </Tabs>
            </Box>

            {activeTab === 'GENERAL' && (
                <Stack spacing={3}>
                    <Grid container spacing={2}>
                        <Grid  xs={12} md={4}>
                            <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                <Typography variant="subtitle2" textTransform="uppercase" fontWeight="bold">Itens Classe A</Typography>
                                <Typography variant="h3" fontWeight="bold" my={1}>{abcAnalysis.filter(i => i.class === 'A').length}</Typography>
                                <Typography variant="body2">Representam 80% do valor de estoque</Typography>
                            </Paper>
                        </Grid>
                        <Grid  xs={12} md={4}>
                            <Paper sx={{ p: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                                <Typography variant="subtitle2" textTransform="uppercase" fontWeight="bold">Itens Classe B</Typography>
                                <Typography variant="h3" fontWeight="bold" my={1}>{abcAnalysis.filter(i => i.class === 'B').length}</Typography>
                                <Typography variant="body2">Representam 15% do valor de estoque</Typography>
                            </Paper>
                        </Grid>
                        <Grid  xs={12} md={4}>
                            <Paper sx={{ p: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
                                <Typography variant="subtitle2" textTransform="uppercase" fontWeight="bold">Valor Total Analisado</Typography>
                                <Typography variant="h4" fontWeight="bold" my={1}>
                                    R$ {items.reduce((a, b) => a + (b.unitCost * b.quantity), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                                <Typography variant="body2">Custo total atual do inventário</Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Card padding="p-0">
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Typography variant="h6" fontWeight="bold">Curva ABC - Itens de Maior Valor</Typography>
                        </Box>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Classificação</TableHead>
                                    <TableHead>Produto</TableHead>
                                    <TableHead className="text-right">Estoque</TableHead>
                                    <TableHead className="text-right">Custo Unit.</TableHead>
                                    <TableHead className="text-right">Valor Total</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {abcAnalysis.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Badge variant={item.class === 'A' ? 'success' : 'warning'}>
                                                Classe {item.class}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">SAP: {item.sapCode}</Typography>
                                        </TableCell>
                                        <TableCell className="text-right">{item.quantity} {item.baseUnit}</TableCell>
                                        <TableCell className="text-right">R$ {item.unitCost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-bold">R$ {item.value.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={item.class === 'A' ? 'success' : item.class === 'B' ? 'warning' : 'danger'}
                                            >
                                                Classe {item.class}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </Stack>
            )}

            {activeTab === 'FLOW' && (
                 <Stack spacing={3}>
                    <Card padding="p-6">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">Fluxo de Movimentação</Typography>
                                <Typography variant="body2" color="text.secondary">Entradas vs. Saídas (Últimos 12 meses)</Typography>
                            </Box>
                        </Box>
                        {history.length > 0 ? (
                            <FlowChart labels={monthlyFlow.labels} dataIn={monthlyFlow.dataIn} dataOut={monthlyFlow.dataOut} />
                        ) : (
                            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'text.secondary' }}>
                                <SignalCellularNodataIcon sx={{ fontSize: 48, opacity: 0.5, mb: 1 }} />
                                <Typography>Nenhuma movimentação registrada.</Typography>
                            </Box>
                        )}
                    </Card>

                    <Grid container spacing={2}>
                        <Grid  xs={12} md={6}>
                            <Paper sx={{ p: 2, bgcolor: 'success.lighter', borderColor: 'success.light', border: 1 }}>
                                <Typography variant="subtitle2" color="success.dark" fontWeight="bold" textTransform="uppercase">Total Entradas (Ano)</Typography>
                                <Typography variant="h4" color="success.main" fontWeight="black" mt={1}>
                                    {monthlyFlow.dataIn.reduce((a, b) => a + b, 0).toLocaleString()} <Typography component="span" variant="caption" fontWeight="medium">unidades</Typography>
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid  xs={12} md={6}>
                            <Paper sx={{ p: 2, bgcolor: 'error.lighter', borderColor: 'error.light', border: 1 }}>
                                <Typography variant="subtitle2" color="error.dark" fontWeight="bold" textTransform="uppercase">Total Saídas (Ano)</Typography>
                                <Typography variant="h4" color="error.main" fontWeight="black" mt={1}>
                                    {monthlyFlow.dataOut.reduce((a, b) => a + b, 0).toLocaleString()} <Typography component="span" variant="caption" fontWeight="medium">unidades</Typography>
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                 </Stack>
            )}

            {activeTab === 'CONTROLLED' && (
                <Stack spacing={3}>
                     <Card padding="p-0">
                        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold">Mapa de Produtos Controlados</Typography>
                            <Button variant="outline" size="sm" startIcon={<PrintIcon />} onClick={() => window.print()}>Imprimir</Button>
                        </Box>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>CAS</TableHead>
                                    <TableHead className="text-right">Saldo Inicial (Est.)</TableHead>
                                    <TableHead className="text-right text-emerald-600">Entradas</TableHead>
                                    <TableHead className="text-right text-red-600">Saídas</TableHead>
                                    <TableHead className="text-right font-bold">Saldo Atual</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {controlledReport.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">{item.name}</Typography>
                                            <Typography variant="caption" fontFamily="monospace" color="text.secondary">{item.sapCode}</Typography>
                                        </TableCell>
                                        <TableCell className="font-mono text-text-secondary">{item.casNumber || '-'}</TableCell>
                                        <TableCell className="text-right text-text-secondary">{(item.quantity - item.totalEntry + item.totalExit).toFixed(3)} {item.baseUnit}</TableCell>
                                        <TableCell sx={{ color: 'success.main', fontWeight: 'medium', textAlign: 'right' }}>{item.totalEntry.toFixed(3)}</TableCell>
                                        <TableCell sx={{ color: 'error.main', fontWeight: 'medium', textAlign: 'right' }}>{item.totalExit.toFixed(3)}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', bgcolor: 'action.hover' }}>{item.quantity.toFixed(3)} {item.baseUnit}</TableCell>
                                    </TableRow>
                                ))}
                                {controlledReport.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            Nenhum produto marcado como "Controlado" no inventário.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </Stack>
            )}

             {activeTab === 'EXPIRY' && (
                <Stack spacing={3}>
                    <Card padding="p-0">
                         <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Typography variant="h6" fontWeight="bold">Risco de Vencimento (Próximos 90 Dias)</Typography>
                        </Box>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Validade</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Quantidade em Risco</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expiryRisk.map(item => {
                                    const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">{item.name}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontFamily="monospace" color="text.secondary">{item.lotNumber}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">{formatDate(item.expiryDate)}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                {days < 0 ? (
                                                    <Badge variant="danger">Vencido</Badge>
                                                ) : (
                                                    <Badge variant="warning">Vence em {days} dias</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontFamily="monospace">{item.quantity} {item.baseUnit}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {expiryRisk.length === 0 && (
                                    <TableRow>
                                         <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            Nenhum item vencendo nos próximos 90 dias.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </Stack>
             )}
        </PageContainer>
    );
};
