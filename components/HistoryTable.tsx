
import React from 'react';
import { MovementRecord } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { MetricCard } from './ui/MetricCard';
import { EmptyState } from './ui/EmptyState';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { formatDateTime } from '../utils/formatters';
import * as ReactWindow from 'react-window';
import * as AutoSizerPkg from 'react-virtualized-auto-sizer';
import { useHistoryFilters } from '../hooks/useHistoryFilters';

const FixedSizeList = (ReactWindow as any).FixedSizeList || (ReactWindow as any).default?.FixedSizeList || (ReactWindow as any).default;
const List = FixedSizeList;
const AutoSizer = (AutoSizerPkg as any).default || AutoSizerPkg;

interface Props {
  // history prop removida, agora o componente é autônomo na busca de dados
  history?: MovementRecord[]; // Mantido opcional para compatibilidade reversa temporária, mas ignorado
  preselectedItemId?: string | null;
  preselectedBatchId?: string | null;
  onClearFilter?: () => void;
}

const GRID_TEMPLATE = "100px minmax(280px, 3fr) 140px minmax(150px, 2fr) 160px";

export const HistoryTable: React.FC<Props> = ({ preselectedItemId, preselectedBatchId, onClearFilter }) => {
  // Hook agora gerencia a busca direta no DB
  const {
      term, setTerm,
      typeFilter, setTypeFilter,
      dateFilter, setDateFilter,
      filtered,
      stats,
      loading
  } = useHistoryFilters(preselectedItemId, preselectedBatchId);

  const getTypeBadge = (type: string) => {
      if (type === 'ENTRADA') return <Badge variant="success" icon="arrow_circle_up">Entrada</Badge>;
      if (type === 'SAIDA') return <Badge variant="danger" icon="arrow_circle_down">Saída</Badge>;
      return <Badge variant="warning" icon="tune">Ajuste</Badge>;
  };

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
      const h = filtered[index];
      const amountColor = h.type === 'ENTRADA' ? 'text-success' : h.type === 'SAIDA' ? 'text-danger' : 'text-warning';

      return (
        <div style={style} className="w-full">
            <div className="h-full border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-slate-800/50 transition-colors group bg-surface-light dark:bg-surface-dark">
                <div className="grid h-full items-center px-4 text-sm" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                    <div className="py-2">
                        {getTypeBadge(h.type)}
                    </div>
                    <div className="py-2 overflow-hidden pr-4">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-sm font-semibold text-text-main dark:text-white truncate" title={h.productName || 'Item Desconhecido'}>
                                {h.productName || <span className="italic text-text-light">Item Arquivado</span>}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary dark:text-gray-400 truncate">
                                {h.batchId ? (
                                    <span className="font-mono bg-primary/5 text-primary dark:text-primary-light px-1.5 py-0.5 rounded text-[10px] border border-primary/10">Batch: {h.batchId}</span>
                                ) : null}
                                <span className="font-mono text-text-light dark:text-slate-400">Lote: {h.lot || 'GEN'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="py-2 text-right pr-8">
                        <span className={`text-sm font-bold font-mono tracking-tight ${amountColor}`}>
                            {h.type === 'ENTRADA' ? '+' : h.type === 'SAIDA' ? '-' : ''}{h.quantity}
                        </span>
                        <span className="text-[10px] font-bold text-text-secondary dark:text-slate-400 ml-1 lowercase">{h.unit || 'un'}</span>
                    </div>
                    <div className="py-2 text-xs text-text-secondary dark:text-gray-400 truncate pr-4" title={h.observation}>
                        {h.observation ? (
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px] opacity-60 shrink-0">sticky_note_2</span>
                                <span className="truncate">{h.observation}</span>
                            </span>
                        ) : (
                            <span className="opacity-30 italic">Sem obs.</span>
                        )}
                    </div>
                    <div className="py-2 text-right text-xs text-text-secondary dark:text-gray-400 font-medium tabular-nums">
                        {formatDateTime(h.date)}
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const sampleBatch = filtered.length > 0 ? filtered[0] : null;

  return (
    <PageContainer>
        <PageHeader 
            title="Histórico de Movimentações" 
            description="Auditoria completa de entradas, saídas e ajustes de inventário."
            className="mb-4"
        >
            <Button variant="white" icon="download" onClick={() => alert('Use o menu de Configurações para exportar dados completos.')}>
                Exportar Relatório
            </Button>
        </PageHeader>
        
        {/* Traceability Context */}
        {preselectedBatchId && sampleBatch && (
            <div className="mb-6 animate-slide-up">
                <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary rounded-r-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Rastreabilidade</span>
                            <h2 className="text-lg font-bold text-text-main dark:text-white">{sampleBatch.productName}</h2>
                        </div>
                        <div className="flex gap-4 text-xs text-text-secondary dark:text-gray-400 font-mono">
                            <span>Lote: <strong>{sampleBatch.lot}</strong></span>
                            <span>ID: {preselectedBatchId}</span>
                        </div>
                    </div>
                    <div className="flex gap-6 text-right">
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-text-light">Saldo Calculado</span>
                            <span className={`text-xl font-bold font-mono ${stats.batchBalance < 0 ? 'text-red-500' : 'text-primary'}`}>
                                {stats.batchBalance.toFixed(3)} <span className="text-xs">{sampleBatch.unit}</span>
                            </span>
                        </div>
                        <div>
                             <span className="block text-[10px] uppercase font-bold text-text-light">Movimentos</span>
                             <span className="text-xl font-bold text-text-main dark:text-white">{filtered.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {!preselectedBatchId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 mb-6">
                <MetricCard 
                    title="Entradas no Período"
                    icon="login"
                    value={stats.totalEntries}
                    subValue="registros"
                    variant="success"
                    className="h-24 sm:h-28"
                />
                 <MetricCard 
                    title="Saídas no Período"
                    icon="logout"
                    value={stats.totalExits}
                    subValue="registros"
                    variant="danger"
                    className="h-24 sm:h-28"
                />
                 <MetricCard 
                    title="Ajustes Manuais"
                    icon="tune"
                    value={stats.totalAdjustments}
                    subValue="registros"
                    variant="warning"
                    className="h-24 sm:h-28"
                />
            </div>
        )}

        {/* Filters Block */}
        <Card padding="p-4" className="flex flex-col gap-3 shrink-0 mb-6 shadow-sm">
            {(preselectedItemId || preselectedBatchId) && (
                <div className="bg-primary/5 border border-primary/20 text-primary px-4 py-3 rounded-lg flex items-center justify-between mb-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined">filter_list</span>
                        <span className="font-bold text-sm">
                            {preselectedBatchId ? 'Rastreando Lote Específico' : 'Filtrando por Item Selecionado'}
                        </span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onClearFilter}
                        className="text-primary hover:text-primary-hover hover:bg-primary/10"
                    >
                        Limpar Filtro <span className="material-symbols-outlined text-sm ml-1">close</span>
                    </Button>
                </div>
            )}
            
            <div className="flex flex-col lg:flex-row gap-4 items-end">
                 <div className="flex-1 w-full">
                    <Input 
                        label="Busca"
                        placeholder="Buscar por item, lote ou código..." 
                        icon="search"
                        value={term}
                        onChange={e => setTerm(e.target.value)}
                        containerClassName="w-full"
                    />
                </div>
                 <div className="flex gap-3 w-full lg:w-auto">
                    <div className="w-full lg:w-48">
                        <Select 
                            label="Tipo de Movimento"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                        >
                            <option value="ALL">Todos</option>
                            <option value="ENTRADA">Entradas</option>
                            <option value="SAIDA">Saídas</option>
                            <option value="AJUSTE">Ajustes</option>
                        </Select>
                    </div>
                    <div className="w-full lg:w-48">
                        <Select 
                            label="Período"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            icon="calendar_today"
                        >
                            <option value="ALL">Todo o Período</option>
                            <option value="TODAY">Hoje</option>
                            <option value="WEEK">Últimos 7 dias</option>
                            <option value="MONTH">Últimos 30 dias</option>
                        </Select>
                    </div>
                 </div>
            </div>
        </Card>

        {/* Table Block */}
        <Card padding="p-0" className="flex-1 min-h-0 flex flex-col bg-surface-light dark:bg-surface-dark shadow-sm overflow-hidden">
             <div className="bg-background-light dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-slate-400 shrink-0">
                <div className="grid items-center px-4" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                    <div className="py-3">Tipo</div>
                    <div className="py-3">Item / Detalhes</div>
                    <div className="py-3 text-right pr-8">Quantidade</div>
                    <div className="py-3">Justificativa</div>
                    <div className="py-3 text-right">Data</div>
                </div>
             </div>

             <div className="flex-1 w-full h-full relative bg-surface-light dark:bg-surface-dark">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-primary">
                        <span className="material-symbols-outlined text-4xl animate-spin mb-2">progress_activity</span>
                        <p className="text-sm font-medium">Carregando dados...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    <AutoSizer>
                        {({ height, width }: { height: number; width: number }) => (
                            <List
                                height={height}
                                itemCount={filtered.length}
                                itemSize={72}
                                width={width}
                                className="custom-scrollbar"
                            >
                                {Row}
                            </List>
                        )}
                    </AutoSizer>
                ) : (
                    <EmptyState 
                        title="Nenhuma movimentação encontrada" 
                        description="Ajuste os filtros de busca para encontrar o que procura."
                        icon="history_toggle_off"
                    />
                )}
             </div>
             
             <div className="bg-background-light dark:bg-slate-800/50 px-6 py-3 border-t border-border-light dark:border-border-dark text-xs text-text-secondary dark:text-slate-400 flex justify-between shrink-0">
                 <span>Total: {filtered.length} registros</span>
                 <span>Ordenado por data (mais recente)</span>
             </div>
        </Card>
    </PageContainer>
  )
};
