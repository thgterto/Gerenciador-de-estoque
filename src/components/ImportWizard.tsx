
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ImportEngine, ImportMode, DetectedTable } from '../utils/ImportEngine';
import { InventoryItem, MovementRecord, RiskFlags, ImportResult } from '../types';
import { ImportService } from '../services/ImportService';
import { generateInventoryId, generateHash } from '../utils/stringUtils'; 
import { useAlert } from '../context/AlertContext';
import { Modal } from './ui/Modal';
import { MetricCard } from './ui/MetricCard';
import { mapMovementType } from '../utils/businessRules';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: ImportMode;
}

// Estados visuais da pipeline
type ProcessingStage = 'IDLE' | 'PARSING' | 'HASHING' | 'MERGING' | 'COMMITTING' | 'DONE';

export const ImportWizard: React.FC<Props> = ({ isOpen, onClose, mode }) => {
  const { addToast } = useAlert();
  const [step, setStep] = useState(1);
  
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  const [detectedTables, setDetectedTables] = useState<DetectedTable[]>([]);
  const [selectedTableIndex, setSelectedTableIndex] = useState<number | null>(null);

  const [rawFile, setRawFile] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [confidences, setConfidences] = useState<Record<string, number>>({});
  
  const [stage, setStage] = useState<ProcessingStage>('IDLE');
  const [detectedRowIndex, setDetectedRowIndex] = useState(0);
  
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [updateStockBalance, setUpdateStockBalance] = useState(false);
  
  const [replaceMode, setReplaceMode] = useState(false);
  
  const [importStats, setImportStats] = useState<ImportResult | null>(null);

  React.useEffect(() => {
    if (isOpen) {
        resetWizard();
        setUpdateStockBalance(mode === 'MASTER'); 
        setReplaceMode(false);
    }
  }, [isOpen, mode]);

  const resetWizard = () => {
      setStep(1);
      setWorkbook(null);
      setAvailableSheets([]);
      setSelectedSheet('');
      setDetectedTables([]);
      setSelectedTableIndex(null);
      setRawFile([]);
      setHeaders([]);
      setMapping({});
      setConfidences({});
      setStage('IDLE');
      setDetectedRowIndex(0);
      setShowErrorsOnly(false);
      setImportStats(null);
  };

  const analyzeSheet = (wb: XLSX.WorkBook, sheetName: string) => {
      try {
          const worksheet = wb.Sheets[sheetName];
          const tables = ImportEngine.detectDataTables(worksheet, mode);
          
          if (tables.length === 0) {
              addToast('Aviso', 'warning', 'Nenhuma tabela clara detectada. Usando primeira linha.');
              processTableData(worksheet, 0); 
          } else if (tables.length === 1) {
              processTableData(worksheet, tables[0].rowIndex);
          } else {
              setDetectedTables(tables);
              setSelectedTableIndex(0);
          }
      } catch (err) {
          console.error(err);
          addToast('Erro', 'error', 'Falha ao analisar a planilha.');
      }
  };

  const processTableData = (worksheet: XLSX.WorkSheet, headerRowIndex: number) => {
      try {
        setDetectedRowIndex(headerRowIndex);

        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        const detectedHeaders = rawRows[headerRowIndex] ? rawRows[headerRowIndex].map(String) : [];
        setHeaders(detectedHeaders);

        const rows = XLSX.utils.sheet_to_json<any>(worksheet, { range: headerRowIndex });
        if (rows.length === 0) throw new Error("Tabela vazia.");
        setRawFile(rows);
        
        const suggestions = ImportEngine.suggestMapping(detectedHeaders, rows, mode);
        
        const initialMap: Record<string, string> = {};
        const initialConf: Record<string, number> = {};
        
        Object.entries(suggestions).forEach(([key, val]) => {
            initialMap[key] = val.col;
            initialConf[key] = val.confidence;
        });

        // Validation Check for Missing Required Fields
        const schema = ImportEngine.getSchema(mode);
        const missingRequired = schema
            .filter(f => f.required && !initialMap[f.key])
            .map(f => f.label);

        if (missingRequired.length > 0) {
            addToast('Atenção', 'warning', `Colunas obrigatórias não identificadas: ${missingRequired.join(', ')}. Por favor, mapeie manualmente.`);
        } else {
            addToast('Sucesso', 'success', 'Colunas mapeadas automaticamente.');
        }

        setMapping(initialMap);
        setConfidences(initialConf);
        setStep(2); 
      } catch (err) {
        console.error(err);
        addToast('Erro', 'error', 'Erro ao processar dados da tabela.');
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        if (wb.SheetNames.length === 0) throw new Error("Arquivo sem abas");

        setWorkbook(wb);
        setAvailableSheets(wb.SheetNames);

        if (wb.SheetNames.length === 1) {
            setSelectedSheet(wb.SheetNames[0]);
            analyzeSheet(wb, wb.SheetNames[0]);
        } else {
            setSelectedSheet(wb.SheetNames[0]);
        }
      } catch (err) {
        console.error(err);
        addToast('Erro', 'error', 'Falha ao ler arquivo.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmSelection = () => {
      if (!workbook) return;
      if (detectedTables.length > 0) {
          if (selectedTableIndex !== null) {
              const worksheet = workbook.Sheets[selectedSheet];
              processTableData(worksheet, detectedTables[selectedTableIndex].rowIndex);
          } else {
              addToast('Seleção Necessária', 'warning', 'Selecione uma das tabelas detectadas.');
          }
      } else {
          analyzeSheet(workbook, selectedSheet);
      }
  };

  const schema = ImportEngine.getSchema(mode);

  const { previewData, stats } = useMemo(() => {
      const processed = rawFile.map(row => ImportEngine.processRow(row, mapping, mode));
      const validCount = processed.filter(r => r.isValid).length;
      const errorCount = processed.filter(r => !r.isValid).length;
      
      return { 
          previewData: processed,
          stats: { total: rawFile.length, valid: validCount, error: errorCount }
      };
  }, [rawFile, mapping, mode]);

  const displayedData = useMemo(() => {
      if (showErrorsOnly) return previewData.filter(r => !r.isValid);
      return previewData.slice(0, 100); 
  }, [previewData, showErrorsOnly]);

  const runPipeline = async () => {
      if (stats.valid === 0) {
          addToast('Importação Bloqueada', 'error', 'Não há registros válidos.');
          return;
      }

      try {
            // ETAPA 1: PARSING
            setStage('PARSING');
            await new Promise(r => setTimeout(r, 400)); // UI delay
            const validRows = previewData.filter(r => r.isValid).map(r => r.data);
            
            // ETAPA 2: HASHING & DEDUPLICAÇÃO
            setStage('HASHING');
            await new Promise(r => setTimeout(r, 400));
            
            if (mode === 'MASTER') {
                const itemsToSave: InventoryItem[] = [];
                const initialHistoryRecords: MovementRecord[] = [];
                const processedIds = new Set();

                validRows.forEach((d) => {
                    // USO DE ID DETERMINÍSTICO PARA PERMITIR SMART MERGE
                    const id = generateInventoryId(d.sapCode, d.name, d.lotNumber);
                    
                    if (processedIds.has(id)) return; 
                    processedIds.add(id);

                    const finalRisks: RiskFlags = d.risks || { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false };

                    itemsToSave.push({
                        id,
                        name: d.name || 'Produto Importado',
                        sapCode: d.sapCode || '',
                        lotNumber: d.lotNumber || 'GEN',
                        // FORÇA ZERO NA DEFINIÇÃO MESTRA (Solicitado)
                        quantity: 0, 
                        baseUnit: d.baseUnit || 'UN',
                        category: d.category || 'Geral',
                        expiryDate: d.expiryDate || '',
                        location: { warehouse: d.warehouse || 'Central', cabinet: d.cabinet || '', shelf: d.shelf || '', position: d.position || '' },
                        risks: finalRisks,
                        minStockLevel: Number(d.minStockLevel) || 0,
                        supplier: d.supplier || '',
                        type: 'ROH',
                        materialGroup: 'Geral',
                        itemStatus: 'Ativo',
                        isControlled: false,
                        casNumber: d.casNumber || '', 
                        lastUpdated: new Date().toISOString(),
                        dateAcquired: new Date().toISOString(),
                        unitCost: 0,
                        currency: 'BRL',
                        // IDs relacionais também determinísticos
                        batchId: `BAT-${id}`,
                        catalogId: `CAT-${id}`
                    });
                });

                // ETAPA 3: MERGING & PERSISTÊNCIA
                setStage('MERGING');
                const result = await ImportService.importBulk(itemsToSave, replaceMode);
                setImportStats(result);

                if (initialHistoryRecords.length > 0) {
                    await ImportService.importHistoryBulk(initialHistoryRecords, true);

                    // Dispara auditoria rápida para alinhar o saldo V1 com o histórico V2 recém criado
                    // ImportService não tem acesso ao InventoryService (para evitar circular),
                    // mas o importHistoryBulk deve cuidar da persistência V2.
                    // Para garantir V1 correto, o ideal é que a auditoria seja chamada pelo consumidor (Settings.tsx)
                    // ou que ImportService.importBulk já considere isso.
                    // Neste caso, deixaremos o hook de UI do usuário (ex: Settings) rodar a auditoria se necessário.
                }

            } else {
                setStage('MERGING');
                const historyToSave: MovementRecord[] = validRows.map(d => {
                    const uniqueString = `${d.date}-${d.type}-${d.productName}-${d.lotNumber}-${d.quantity}`;
                    const hashId = generateHash(uniqueString);

                    return {
                        id: `HIST-IMP-${hashId}`,
                        itemId: '', 
                        date: d.date,
                        type: mapMovementType(d.type),
                        productName: d.productName || 'Item Importado',
                        sapCode: d.sapCode || '',
                        lot: d.lotNumber || 'GEN',
                        quantity: d.quantity,
                        unit: d.unit || 'UN',
                        observation: d.observation || 'Importação de Histórico',
                        location_warehouse: d.warehouse || 'Importado',
                        supplier: d.supplier || ''
                    };
                });
                
                setStage('COMMITTING');
                await ImportService.importHistoryBulk(historyToSave, updateStockBalance);
                setImportStats({ created: historyToSave.length, updated: 0, total: historyToSave.length, ignored: 0 });
            }
            
            setStage('DONE');
            
      } catch (e) {
            console.error(e);
            addToast('Erro', 'error', 'Falha na importação.');
            setStage('IDLE');
      }
  };

  const isTableSelection = detectedTables.length > 1;
  const isUpload = !workbook;

  // --- UI Components ---

  const StageIndicator = ({ current, target, label, icon }: { current: ProcessingStage, target: ProcessingStage, label: string, icon: string }) => {
      const isActive = current === target;
      const isDone = ['DONE', 'COMMITTING', 'MERGING', 'HASHING', 'PARSING'].indexOf(current) > ['DONE', 'COMMITTING', 'MERGING', 'HASHING', 'PARSING'].indexOf(target);
      
      let colorClass = "text-gray-400 border-gray-200 bg-gray-50";
      if (isActive) colorClass = "text-primary border-primary bg-primary/10 animate-pulse";
      if (isDone) colorClass = "text-green-600 border-green-500 bg-green-50";

      return (
          <div className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 ${colorClass} transition-all w-32`}>
              <span className="material-symbols-outlined text-2xl">{isDone ? 'check_circle' : icon}</span>
              <span className="text-xs font-bold uppercase">{label}</span>
          </div>
      );
  };

  return (
    <Modal
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Importar ${mode === 'MASTER' ? 'Inventário' : 'Histórico'}`}
        className="max-w-6xl h-[90vh] max-h-[850px] w-full"
        hideHeader
        noPadding={true}
    >
        <div className="flex flex-col h-full bg-white dark:bg-surface-dark">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">upload_file</span>
                    Importar {mode === 'MASTER' ? 'Inventário' : 'Histórico'}
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <div className="px-8 py-4 border-b border-border-light dark:border-border-dark flex justify-center bg-white dark:bg-surface-dark flex-shrink-0">
                 <div className="flex items-center gap-2">
                    <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    <span className="text-sm font-medium">Upload</span>
                    <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full bg-primary transition-all duration-500 ${step > 1 ? 'w-full' : 'w-0'}`}></div></div>
                    <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                    <span className="text-sm font-medium">Mapear</span>
                    <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full bg-primary transition-all duration-500 ${step > 2 ? 'w-full' : 'w-0'}`}></div></div>
                    <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                    <span className="text-sm font-medium">Processar</span>
                 </div>
            </div>

            {/* Container de Conteúdo */}
            <div className="flex-1 overflow-hidden flex flex-col p-6 bg-background-light dark:bg-background-dark">
                {step === 1 && (
                    <div className="h-full flex flex-col items-center justify-center overflow-y-auto">
                        {isUpload ? (
                            <div className="w-full max-w-2xl h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors relative group cursor-pointer">
                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept=".xlsx,.xls,.csv,.xlsm" />
                                <div className="bg-primary/10 p-6 rounded-full text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-5xl">cloud_upload</span>
                                </div>
                                <h3 className="text-lg font-bold text-text-main dark:text-white">Arraste sua planilha aqui</h3>
                                <p className="text-text-secondary dark:text-gray-400 text-sm mt-2">Suporta .xlsx, .xlsm, .xls e .csv</p>
                            </div>
                        ) : isTableSelection ? (
                             <div className="w-full max-w-4xl flex flex-col gap-4 animate-fade-in overflow-y-auto">
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-center gap-3 mb-2">
                                    <span className="material-symbols-outlined text-amber-600">table_view</span>
                                    <div>
                                        <h4 className="font-bold text-amber-900">Múltiplas Tabelas Detectadas</h4>
                                        <p className="text-sm text-amber-800">Identificamos mais de uma estrutura de dados. Selecione qual deseja importar:</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {detectedTables.map((table, idx) => (
                                        <div 
                                            key={table.id}
                                            onClick={() => setSelectedTableIndex(idx)}
                                            className={`
                                                cursor-pointer p-4 rounded-xl border-2 transition-all hover:shadow-md
                                                ${selectedTableIndex === idx ? 'border-primary bg-primary/5' : 'border-border-light bg-white dark:bg-slate-800 dark:border-gray-700 hover:border-primary/50'}
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Opção {idx + 1}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${table.confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {table.confidence}% Confiança
                                                </span>
                                            </div>
                                            <div className="text-sm text-text-main dark:text-white mb-3">
                                                Inicia na <strong>Linha {table.rowIndex + 1}</strong> • ~{table.rowCountEstimate} Registros
                                            </div>
                                            <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded text-xs font-mono text-text-secondary truncate">
                                                {table.preview.join(' | ')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="primary" fullWidth onClick={handleConfirmSelection} className="mt-4">
                                    Confirmar Seleção
                                </Button>
                             </div>
                        ) : (
                            <div className="w-full max-w-lg flex flex-col gap-6 animate-fade-in text-center">
                                 <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-full mx-auto text-green-600">
                                     <span className="material-symbols-outlined text-6xl">check_circle</span>
                                 </div>
                                 <div>
                                     <h3 className="text-xl font-bold text-text-main dark:text-white">Arquivo Analisado</h3>
                                     <p className="text-text-secondary dark:text-gray-400 mt-2">
                                         Planilha: <strong>{selectedSheet}</strong>
                                     </p>
                                 </div>
                                 {availableSheets.length > 1 && (
                                     <div className="flex flex-col gap-2 text-left">
                                         <label className="text-sm font-bold">Alterar Aba:</label>
                                         <select 
                                            value={selectedSheet}
                                            onChange={e => { setSelectedSheet(e.target.value); analyzeSheet(workbook!, e.target.value); }}
                                            className="w-full rounded-lg border-gray-300 dark:bg-slate-800"
                                         >
                                             {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                     </div>
                                 )}
                                 <Button variant="primary" fullWidth onClick={handleConfirmSelection}>Continuar para Mapeamento</Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col gap-6 h-full overflow-y-auto">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-start gap-3 shrink-0">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">auto_fix</span>
                            <div>
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Cabeçalho Detectado (Linha {detectedRowIndex + 1})</h4>
                                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                    O sistema analisou os dados para sugerir o melhor mapeamento.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                            {schema.map(field => {
                                const selectedHeader = mapping[field.key] || '';
                                const confidence = confidences[field.key] || 0;
                                const isMapped = !!selectedHeader;
                                
                                return (
                                    <div key={field.key} className={`p-3 rounded-lg border shadow-sm flex flex-col gap-2 transition-colors ${isMapped ? 'bg-white dark:bg-slate-800 border-border-light' : 'bg-gray-50 dark:bg-slate-900 border-dashed border-gray-300'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-text-main dark:text-white flex items-center gap-1">
                                                {field.label} {field.required && <span className="text-danger" title="Obrigatório">*</span>}
                                            </span>
                                            {isMapped && (
                                                <span className={`text-[10px] px-1.5 rounded ${confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {confidence}% match
                                                </span>
                                            )}
                                        </div>
                                        <select 
                                            value={selectedHeader} 
                                            onChange={(e) => setMapping(prev => ({...prev, [field.key]: e.target.value}))}
                                            className={`w-full text-sm rounded-md ${isMapped ? 'border-primary/50 ring-1 ring-primary/20' : 'border-gray-300'} dark:bg-slate-900 dark:text-white`}
                                        >
                                            <option value="">(Ignorar Coluna)</option>
                                            {headers.map((h, i) => (
                                                <option key={`${h}-${i}`} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col h-full gap-6 items-center justify-center overflow-hidden relative">
                        {/* VISUAL PIPELINE */}
                        {stage !== 'IDLE' && stage !== 'DONE' && (
                            <div className="flex items-center gap-4 animate-fade-in absolute inset-0 z-50 bg-white/90 dark:bg-slate-900/90 flex-col justify-center">
                                <h3 className="text-2xl font-bold text-primary mb-8">Processando Dados...</h3>
                                <div className="flex gap-4">
                                    <StageIndicator current={stage} target="PARSING" label="Lendo Arquivo" icon="file_open" />
                                    <div className="h-1 w-8 bg-gray-200 self-center"></div>
                                    <StageIndicator current={stage} target="HASHING" label="Gerando IDs" icon="fingerprint" />
                                    <div className="h-1 w-8 bg-gray-200 self-center"></div>
                                    <StageIndicator current={stage} target="MERGING" label="Smart Merge" icon="merge_type" />
                                    <div className="h-1 w-8 bg-gray-200 self-center"></div>
                                    <StageIndicator current={stage} target="COMMITTING" label="Salvando" icon="save" />
                                </div>
                            </div>
                        )}

                        {stage === 'DONE' && importStats ? (
                            <div className="w-full max-w-3xl flex flex-col gap-6 animate-scale-in">
                                <div className="text-center">
                                    <div className="inline-flex p-4 rounded-full bg-green-100 text-green-600 mb-4">
                                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-text-main dark:text-white">Importação Concluída!</h2>
                                    <p className="text-text-secondary dark:text-gray-400">O banco de dados foi atualizado com sucesso.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <MetricCard title="Novos Itens" icon="add_circle" value={importStats.created} variant="success" className="bg-green-50" />
                                    <MetricCard title="Atualizados (Merge)" icon="update" value={importStats.updated} variant="info" className="bg-blue-50" />
                                </div>
                                
                                <div className="flex justify-center mt-4">
                                    <Button onClick={onClose} variant="primary" size="lg">Voltar ao Inventário</Button>
                                </div>
                            </div>
                        ) : (
                            /* CONFIGURAÇÃO PRE-IMPORT */
                            <div className="w-full h-full flex flex-col gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                                    <MetricCard title="Total Detectado" icon="table_rows" value={stats.total} className="border-l-4 border-l-primary" variant="primary" />
                                    <MetricCard title="Registros Válidos" icon="check_circle" value={stats.valid} className="border-l-4 border-l-success" variant="success" />
                                    <MetricCard title="Erros de Validação" icon="warning" value={stats.error} className="border-l-4 border-l-danger bg-danger-bg/20" variant="danger" />
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-border-light dark:border-gray-700 flex flex-col gap-4 shrink-0">
                                    <h4 className="text-lg font-bold text-text-main dark:text-white mb-1">Estratégia de Importação</h4>
                                    
                                    {mode === 'MASTER' && (
                                        <div className="flex flex-col gap-3">
                                             <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${!replaceMode ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                                <input type="radio" checked={!replaceMode} onChange={() => setReplaceMode(false)} className="mt-1 text-primary focus:ring-primary" />
                                                <div>
                                                    <span className="font-bold text-text-main dark:text-white block">Smart Merge (Recomendado)</span>
                                                    <span className="text-xs text-text-secondary dark:text-gray-400">
                                                        Atualiza o saldo de itens existentes e cria novos. Mantém dados enriquecidos manualmente (Fórmulas, Riscos) intactos.
                                                    </span>
                                                </div>
                                            </label>

                                            <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${replaceMode ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                                <input type="radio" checked={replaceMode} onChange={() => setReplaceMode(true)} className="mt-1 text-red-600 focus:ring-red-500" />
                                                <div>
                                                    <span className="font-bold text-red-700 dark:text-red-300 block">Substituição Total (Wipe & Load)</span>
                                                    <span className="text-xs text-text-secondary dark:text-gray-400">
                                                        APAGA todo o banco de dados atual antes de importar. Use apenas para recarga completa do sistema.
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    )}

                                    {mode === 'HISTORY' && (
                                        <div className="flex items-start gap-3">
                                            <input 
                                                type="checkbox" 
                                                id="updateStock" 
                                                checked={updateStockBalance} 
                                                onChange={e => setUpdateStockBalance(e.target.checked)}
                                                className="mt-1 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                                            />
                                            <label htmlFor="updateStock" className="cursor-pointer">
                                                <span className="text-sm font-bold text-text-main dark:text-white">Atualizar Saldo de Estoque</span>
                                                <p className="text-xs text-text-secondary dark:text-gray-400">
                                                    Recalcula o saldo dos itens baseado nas entradas/saídas deste histórico.
                                                </p>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Preview Data Grid */}
                                <div className="flex-1 overflow-hidden border border-border-light dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 shadow-inner relative flex flex-col">
                                    <div className="absolute top-2 right-2 z-20">
                                        <button 
                                            onClick={() => setShowErrorsOnly(!showErrorsOnly)}
                                            className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm transition-all ${showErrorsOnly ? 'bg-red-500 text-white' : 'bg-white text-text-secondary border'}`}
                                        >
                                            {showErrorsOnly ? 'Mostrando Apenas Erros' : 'Mostrar Erros'}
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs whitespace-nowrap text-gray-700 dark:text-gray-300">
                                            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold w-24 bg-gray-50 dark:bg-slate-900">Status</th>
                                                    {schema.map(f => <th key={f.key} className="px-4 py-3 font-bold bg-gray-50 dark:bg-slate-900">{f.label}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {displayedData.map((row, i) => (
                                                    <tr key={i} className={!row.isValid ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                                        <td className="px-4 py-2">
                                                            {row.isValid ? (
                                                                <span className="text-green-600 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check</span> OK</span>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <span className="text-red-600 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> Erro</span>
                                                                    <span className="text-[10px] text-red-500 truncate max-w-[100px]" title={row.errors.join(', ')}>{row.errors[0]}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        {schema.map(f => (
                                                            <td key={f.key} className="px-4 py-2 max-w-[150px] truncate" title={String(row.data[f.key])}>
                                                                {String(row.data[f.key] || '')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="px-6 py-4 border-t border-border-light dark:border-border-dark bg-white dark:bg-surface-dark flex justify-between flex-shrink-0">
                {step > 1 && stage === 'IDLE' ? (
                     <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-bold text-sm transition-colors">Voltar</button>
                ) : <div></div>}
                
                {step === 2 && (
                    <button
                        onClick={() => setStep(step + 1)} 
                        disabled={Object.values(mapping).filter(Boolean).length === 0}
                        className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        Validar Dados
                    </button>
                )}
                
                {step === 3 && stage === 'IDLE' && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={runPipeline}
                            disabled={stats.valid === 0}
                            className={`px-6 py-2 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${replaceMode ? 'bg-red-600 hover:bg-red-700' : 'bg-success hover:bg-emerald-600'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                            {replaceMode ? 'Iniciar Substituição' : 'Iniciar Importação'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    </Modal>
  );
};
