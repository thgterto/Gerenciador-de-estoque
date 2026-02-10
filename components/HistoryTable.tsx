import React, { useMemo } from 'react';
import { MovementRecord } from '../types';
import {
    Box, Chip, Typography, TextField, MenuItem, Button, Card, CardContent,
    Tooltip, Stack, Select, FormControl, InputLabel
} from '@mui/material';
import { Grid } from '@mui/material';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useHistoryFilters } from '../hooks/useHistoryFilters';
import { ExportEngine } from '../utils/ExportEngine';
import { formatDateTime } from '../utils/formatters';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';

// Icons
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import NoteIcon from '@mui/icons-material/Note';

interface Props {
  history?: MovementRecord[]; 
  preselectedItemId?: string | null;
  preselectedBatchId?: string | null;
  onClearFilter?: () => void;
}

const GRID_TEMPLATE = "100px minmax(280px, 3fr) 140px minmax(150px, 2fr) 160px";

const getTypeChip = (type: string) => {
    if (type === 'ENTRADA') return <Chip icon={<ArrowCircleUpIcon />} label="Entrada" color="success" size="small" variant="outlined" />;
    if (type === 'SAIDA') return <Chip icon={<ArrowCircleDownIcon />} label="Saída" color="error" size="small" variant="outlined" />;
    return <Chip icon={<TuneIcon />} label="Ajuste" color="warning" size="small" variant="outlined" />;
};

const HistoryRow = ({ index, style, data }: { index: number, style: React.CSSProperties, data: { filtered: MovementRecord[] } }) => {
    const h = data.filtered[index];
    if (!h) return null;
    
    const amountColor = h.type === 'ENTRADA' ? 'success.main' : h.type === 'SAIDA' ? 'error.main' : 'warning.main';
    const sign = h.type === 'ENTRADA' ? '+' : h.type === 'SAIDA' ? '-' : '';

    return (
      <div style={style}>
          <Box
            sx={{
                height: '100%',
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                display: 'grid',
                gridTemplateColumns: GRID_TEMPLATE,
                alignItems: 'center',
                px: 2
            }}
          >
              <Box>{getTypeChip(h.type)}</Box>

              <Box sx={{ pr: 2, overflow: 'hidden' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>
                      {h.productName || <Box component="span" fontStyle="italic" color="text.secondary">Item Arquivado</Box>}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                      {h.batchId && (
                          <Chip label={`Batch: ${h.batchId}`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                      )}
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          Lote: {h.lot || 'GEN'}
                      </Typography>
                  </Stack>
              </Box>

              <Box sx={{ textAlign: 'right', pr: 4 }}>
                  <Typography variant="body2" fontWeight="bold" fontFamily="monospace" color={amountColor}>
                      {sign}{h.quantity}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      {h.unit || 'un'}
                  </Typography>
              </Box>

              <Box sx={{ pr: 2, overflow: 'hidden' }}>
                  {h.observation ? (
                      <Tooltip title={h.observation}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                              <NoteIcon fontSize="inherit" color="action" />
                              <Typography variant="caption" color="text.secondary" noWrap>
                                  {h.observation}
                              </Typography>
                          </Stack>
                      </Tooltip>
                  ) : (
                      <Typography variant="caption" color="text.disabled" fontStyle="italic">Sem obs.</Typography>
                  )}
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                      {formatDateTime(h.date)}
                  </Typography>
              </Box>
          </Box>
      </div>
    );
};

export const HistoryTable: React.FC<Props> = ({ preselectedItemId, preselectedBatchId, onClearFilter }) => {
  const {
      term, setTerm,
      typeFilter, setTypeFilter,
      dateFilter, setDateFilter,
      filtered,
      stats,
      loading
  } = useHistoryFilters(preselectedItemId, preselectedBatchId);

  const sampleBatch = filtered.length > 0 ? filtered[0] : null;
  const itemData = useMemo(() => ({ filtered }), [filtered]);

  return (
    <PageContainer>
        <PageHeader 
            title="Histórico de Movimentações" 
            description="Auditoria completa de entradas, saídas e ajustes de inventário."
        >
            <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => {
                    const data = ExportEngine.prepareHistoryData(filtered);
                    ExportEngine.generateExcel([{ name: 'Historico Filtrado', data }], 'Historico_Movimentacoes');
                }}
            >
                Exportar Relatório
            </Button>
        </PageHeader>
        
        {/* Traceability Banner */}
        {preselectedBatchId && sampleBatch && (
            <Card sx={{ mb: 3, borderLeft: 6, borderColor: 'primary.main' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Chip label="Rastreabilidade" color="primary" size="small" sx={{ mb: 1, fontWeight: 'bold' }} />
                        <Typography variant="h6" fontWeight="bold">{sampleBatch.productName}</Typography>
                        <Stack direction="row" spacing={2} mt={1}>
                            <Typography variant="body2" fontFamily="monospace">Lote: <strong>{sampleBatch.lot}</strong></Typography>
                            <Typography variant="body2" color="text.secondary">ID: {preselectedBatchId}</Typography>
                        </Stack>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" display="block" fontWeight="bold" color="text.secondary">SALDO CALCULADO</Typography>
                        <Typography variant="h4" fontWeight="bold" color={stats.batchBalance < 0 ? 'error.main' : 'primary.main'} fontFamily="monospace">
                            {stats.batchBalance.toFixed(3)} <Typography component="span" variant="caption">{sampleBatch.unit}</Typography>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        )}

        {!preselectedBatchId && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard title="Entradas" value={stats.totalEntries} subValue="regs" icon={<LoginIcon />} color="success" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard title="Saídas" value={stats.totalExits} subValue="regs" icon={<LogoutIcon />} color="error" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard title="Ajustes" value={stats.totalAdjustments} subValue="regs" icon={<TuneIcon />} color="warning" />
                </Grid>
            </Grid>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3, p: 2 }} variant="outlined">
            {(preselectedItemId || preselectedBatchId) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, bgcolor: 'primary.light', p: 1, borderRadius: 1, color: 'primary.contrastText' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon />
                        <Typography variant="subtitle2">
                            {preselectedBatchId ? 'Rastreando Lote Específico' : 'Filtrando por Item Selecionado'}
                        </Typography>
                    </Box>
                    <Button 
                        size="small"
                        onClick={onClearFilter}
                        sx={{ color: 'inherit', borderColor: 'inherit' }}
                        endIcon={<CloseIcon />}
                    >
                        Limpar
                    </Button>
                </Box>
            )}
            
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="end">
                 <TextField
                    label="Busca"
                    placeholder="Buscar por item, lote ou código..."
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    fullWidth
                    InputProps={{
                        startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    }}
                    size="small"
                />

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Tipo de Movimento</InputLabel>
                    <Select
                        value={typeFilter}
                        label="Tipo de Movimento"
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                    >
                        <MenuItem value="ALL">Todos</MenuItem>
                        <MenuItem value="ENTRADA">Entradas</MenuItem>
                        <MenuItem value="SAIDA">Saídas</MenuItem>
                        <MenuItem value="AJUSTE">Ajustes</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Período</InputLabel>
                    <Select
                        value={dateFilter}
                        label="Período"
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        startAdornment={<CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                        <MenuItem value="ALL">Todo o Período</MenuItem>
                        <MenuItem value="TODAY">Hoje</MenuItem>
                        <MenuItem value="WEEK">Últimos 7 dias</MenuItem>
                        <MenuItem value="MONTH">Últimos 30 dias</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
        </Card>

        {/* Table Area */}
        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: 600 }} variant="outlined">
             <Box sx={{
                 display: 'grid',
                 gridTemplateColumns: GRID_TEMPLATE,
                 px: 2,
                 py: 1.5,
                 bgcolor: 'background.default',
                 borderBottom: 1,
                 borderColor: 'divider'
             }}>
                <Typography variant="caption" fontWeight="bold">TIPO</Typography>
                <Typography variant="caption" fontWeight="bold">ITEM / DETALHES</Typography>
                <Typography variant="caption" fontWeight="bold" align="right" sx={{ pr: 4 }}>QUANTIDADE</Typography>
                <Typography variant="caption" fontWeight="bold">JUSTIFICATIVA</Typography>
                <Typography variant="caption" fontWeight="bold" align="right">DATA</Typography>
             </Box>

             <Box sx={{ flexGrow: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography>Carregando...</Typography>
                    </Box>
                ) : filtered.length > 0 ? (
                    <AutoSizer>
                        {({ height, width }: { height: number; width: number }) => (
                            <List
                                height={height}
                                itemCount={filtered.length}
                                itemSize={72}
                                width={width}
                                itemData={itemData}
                            >
                                {HistoryRow}
                            </List>
                        )}
                    </AutoSizer>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                        <HistoryToggleOffIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6">Nenhuma movimentação</Typography>
                        <Typography variant="body2">Ajuste os filtros para encontrar registros.</Typography>
                    </Box>
                )}
             </Box>
             
             <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                 <Typography variant="caption" color="text.secondary">Total: {filtered.length} registros</Typography>
             </Box>
        </Card>
    </PageContainer>
  )
};

const StatCard = ({ title, icon, value, subValue, color }: any) => (
    <Card variant="outlined">
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
            <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${color}.light`, color: `${color}.main` }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                    {title}
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                    {value} <Typography component="span" variant="caption" color="text.secondary">{subValue}</Typography>
                </Typography>
            </Box>
        </CardContent>
    </Card>
);
