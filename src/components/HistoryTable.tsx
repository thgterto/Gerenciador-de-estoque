import React, { useMemo } from 'react';
import { MovementRecord } from '../types';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useHistoryFilters } from '../hooks/useHistoryFilters';
import { ExportEngine } from '../utils/ExportEngine';
import { formatDateTime } from '../utils/formatters';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { OrbitalSelect } from './ui/orbital/OrbitalSelect';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import {
    Download,
    Filter,
    X,
    Search,
    LogIn,
    LogOut,
    SlidersHorizontal,
    History,
    FileText
} from 'lucide-react';

interface Props {
  history?: MovementRecord[]; 
  preselectedItemId?: string | null;
  preselectedBatchId?: string | null;
  onClearFilter?: () => void;
}

const GRID_TEMPLATE = "100px minmax(280px, 3fr) 140px minmax(150px, 2fr) 160px";

const getTypeBadge = (type: string) => {
    if (type === 'ENTRADA') return <OrbitalBadge variant="success" label="Entrada" />;
    if (type === 'SAIDA') return <OrbitalBadge variant="danger" label="Saída" />;
    return <OrbitalBadge variant="warning" label="Ajuste" />;
};

const HistoryMobileRow = ({ item }: { item: MovementRecord }) => {
    const amountColor = item.type === 'ENTRADA' ? 'text-orbital-success' : item.type === 'SAIDA' ? 'text-orbital-danger' : 'text-orbital-warning';
    const sign = item.type === 'ENTRADA' ? '+' : item.type === 'SAIDA' ? '-' : '';

    return (
        <div className="p-3 border-b border-orbital-border bg-orbital-surface/50 hover:bg-orbital-surface transition-colors">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    {getTypeBadge(item.type)}
                    <span className="text-xs text-orbital-subtext">{formatDateTime(item.date)}</span>
                </div>
                <div className={`text-sm font-mono font-bold ${amountColor}`}>
                    {sign}{item.quantity} {item.unit}
                </div>
            </div>

            <div className="font-bold text-sm text-orbital-text truncate mb-1">
                {item.productName || <span className="italic opacity-70">Item Arquivado</span>}
            </div>

            <div className="flex gap-2 items-center mb-1">
                {item.batchId && (
                    <span className="px-1.5 py-0.5 text-[9px] border border-orbital-accent rounded text-orbital-accent font-mono">
                        {item.batchId.split('-').pop()}
                    </span>
                )}
                <span className="text-xs text-orbital-subtext font-mono">Lote: {item.lot || 'GEN'}</span>
            </div>

            {item.observation && (
                <div className="text-xs text-orbital-subtext italic bg-orbital-bg/50 p-1.5 rounded border border-orbital-border/50">
                    Obs: {item.observation}
                </div>
            )}
        </div>
    );
};

const HistoryRow = ({ index, style, data }: { index: number, style: React.CSSProperties, data: { filtered: MovementRecord[] } }) => {
    const h = data.filtered[index];
    if (!h) return null;
    
    const amountColor = h.type === 'ENTRADA' ? 'text-orbital-success' : h.type === 'SAIDA' ? 'text-orbital-danger' : 'text-orbital-warning';
    const sign = h.type === 'ENTRADA' ? '+' : h.type === 'SAIDA' ? '-' : '';

    return (
      <div style={style}>
          <div
            className="h-full border-b border-orbital-border bg-orbital-bg hover:bg-orbital-surface/50 transition-colors grid items-center px-4"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
              <div>{getTypeBadge(h.type)}</div>

              <div className="pr-4 overflow-hidden">
                  <div className="font-bold text-sm text-orbital-text truncate">
                      {h.productName || <span className="italic text-orbital-subtext">Item Arquivado</span>}
                  </div>
                  <div className="flex items-center gap-2">
                      {h.batchId && (
                          <span className="text-[9px] px-1 border border-orbital-accent text-orbital-accent rounded">
                              Batch: {h.batchId}
                          </span>
                      )}
                      <span className="text-xs text-orbital-subtext font-mono">Lote: {h.lot || 'GEN'}</span>
                  </div>
              </div>

              <div className="text-right pr-4">
                  <div className={`font-mono font-bold text-sm ${amountColor}`}>
                      {sign}{h.quantity}
                  </div>
                  <div className="text-[10px] text-orbital-subtext font-bold uppercase">{h.unit || 'un'}</div>
              </div>

              <div className="pr-4 overflow-hidden">
                  {h.observation ? (
                      <div className="flex items-center gap-1 text-orbital-subtext" title={h.observation}>
                          <FileText size={12} />
                          <span className="text-xs truncate">{h.observation}</span>
                      </div>
                  ) : (
                      <span className="text-xs text-orbital-border italic">Sem obs.</span>
                  )}
              </div>

              <div className="text-right text-xs text-orbital-subtext font-medium">
                  {formatDateTime(h.date)}
              </div>
          </div>
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
  const isMobile = window.innerWidth < 768;

  return (
    <PageContainer scrollable={true}>
        <PageHeader 
            title="Histórico de Movimentações" 
            description="Auditoria completa de entradas, saídas e ajustes de inventário."
        >
            <OrbitalButton
                variant="outline"
                icon={<Download size={16} />}
                onClick={() => {
                    const data = ExportEngine.prepareHistoryData(filtered);
                    ExportEngine.generateExcel([{ name: 'Historico Filtrado', data }], 'Historico_Movimentacoes');
                }}
            >
                Exportar Relatório
            </OrbitalButton>
        </PageHeader>
        
        {/* Traceability Banner */}
        {preselectedBatchId && sampleBatch && (
            <OrbitalCard className="mb-6 border-l-4 border-l-orbital-accent">
                <div className="flex justify-between items-center">
                    <div>
                        <OrbitalBadge label="Rastreabilidade" variant="primary" className="mb-2" />
                        <h3 className="text-xl font-bold text-orbital-text">{sampleBatch.productName}</h3>
                        <div className="flex gap-4 mt-2 text-sm">
                            <span className="font-mono text-orbital-accent">Lote: <strong>{sampleBatch.lot}</strong></span>
                            <span className="text-orbital-subtext font-mono">ID: {preselectedBatchId}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs font-bold text-orbital-subtext uppercase tracking-wider">SALDO CALCULADO</span>
                        <div className={`text-3xl font-mono font-bold ${stats.batchBalance < 0 ? 'text-orbital-danger' : 'text-orbital-accent'}`}>
                            {stats.batchBalance.toFixed(3)} <span className="text-sm font-normal text-orbital-subtext">{sampleBatch.unit}</span>
                        </div>
                    </div>
                </div>
            </OrbitalCard>
        )}

        {!preselectedBatchId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard title="Entradas" value={stats.totalEntries} subValue="regs" icon={<LogIn size={20} />} color="text-orbital-success" />
                <StatCard title="Saídas" value={stats.totalExits} subValue="regs" icon={<LogOut size={20} />} color="text-orbital-danger" />
                <StatCard title="Ajustes" value={stats.totalAdjustments} subValue="regs" icon={<SlidersHorizontal size={20} />} color="text-orbital-warning" />
            </div>
        )}

        {/* Filters */}
        <OrbitalCard className="mb-6" noPadding>
            <div className="p-4">
                {(preselectedItemId || preselectedBatchId) && (
                    <div className="flex justify-between items-center mb-4 bg-orbital-accent/10 p-2 rounded border border-orbital-accent/30 text-orbital-accent">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <Filter size={16} />
                            <span>
                                {preselectedBatchId ? 'Rastreando Lote Específico' : 'Filtrando por Item Selecionado'}
                            </span>
                        </div>
                        <button
                            onClick={onClearFilter}
                            className="text-orbital-accent hover:text-white hover:bg-orbital-accent/20 rounded p-1 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 items-end">
                     <OrbitalInput
                        label="Busca"
                        placeholder="Buscar por item, lote ou código..."
                        value={term}
                        onChange={e => setTerm(e.target.value)}
                        fullWidth
                        startAdornment={<Search size={16} />}
                        className="md:w-96"
                    />

                    <div className="w-full md:w-64">
                        <OrbitalSelect
                            label="Tipo de Movimento"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            options={[
                                { value: "ALL", label: "Todos" },
                                { value: "ENTRADA", label: "Entradas" },
                                { value: "SAIDA", label: "Saídas" },
                                { value: "AJUSTE", label: "Ajustes" }
                            ]}
                            fullWidth
                        />
                    </div>

                    <div className="w-full md:w-64">
                        <OrbitalSelect
                            label="Período"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            options={[
                                { value: "ALL", label: "Todo o Período" },
                                { value: "TODAY", label: "Hoje" },
                                { value: "WEEK", label: "Últimos 7 dias" },
                                { value: "MONTH", label: "Últimos 30 dias" }
                            ]}
                            fullWidth
                        />
                    </div>
                </div>
            </div>
        </OrbitalCard>

        {/* Table Area */}
        <OrbitalCard className="flex-grow flex flex-col min-h-[400px]" noPadding>
             {!isMobile && (
                 <div
                    className="grid px-4 py-2 border-b border-orbital-border bg-orbital-surface text-xs font-bold text-orbital-subtext uppercase tracking-wider"
                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                 >
                    <div>TIPO</div>
                    <div>ITEM / DETALHES</div>
                    <div className="text-right pr-4">QUANTIDADE</div>
                    <div>JUSTIFICATIVA</div>
                    <div className="text-right">DATA</div>
                 </div>
             )}

             <div className="flex-grow relative bg-orbital-bg">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-orbital-subtext">
                        <div className="animate-spin mb-2 w-6 h-6 border-2 border-orbital-accent border-t-transparent rounded-full" />
                        <span>Carregando...</span>
                    </div>
                ) : filtered.length > 0 ? (
                    isMobile ? (
                        <div>
                            {filtered.map((item, index) => (
                                <HistoryMobileRow key={index} item={item} />
                            ))}
                        </div>
                    ) : (
                        <AutoSizer>
                            {({ height, width }: { height: number; width: number }) => (
                                <List
                                    height={height}
                                    itemCount={filtered.length}
                                    itemSize={56} // reduced height for cleaner look
                                    width={width}
                                    itemData={itemData}
                                    className="custom-scrollbar"
                                >
                                    {HistoryRow}
                                </List>
                            )}
                        </AutoSizer>
                    )
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-orbital-subtext opacity-50">
                        <History size={48} className="mb-2" />
                        <h3 className="text-lg font-bold">Nenhuma movimentação</h3>
                        <p className="text-sm">Ajuste os filtros para encontrar registros.</p>
                    </div>
                )}
             </div>
             
             {!isMobile && (
                 <div className="p-2 border-t border-orbital-border bg-orbital-surface flex justify-between items-center text-xs text-orbital-subtext">
                     <span>Total: {filtered.length} registros</span>
                 </div>
             )}
        </OrbitalCard>
    </PageContainer>
  )
};

const StatCard = ({ title, icon, value, subValue, color }: any) => (
    <OrbitalCard>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded bg-orbital-bg border border-orbital-border ${color}`}>
                {icon}
            </div>
            <div>
                <div className="text-xs font-bold uppercase tracking-wider text-orbital-subtext">
                    {title}
                </div>
                <div className="text-2xl font-mono font-bold text-orbital-text">
                    {value} <span className="text-xs font-normal text-orbital-subtext">{subValue}</span>
                </div>
            </div>
        </div>
    </OrbitalCard>
);
