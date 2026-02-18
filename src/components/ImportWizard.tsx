
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ImportEngine, ImportMode, DetectedTable } from '../utils/ImportEngine';
import { InventoryItem, MovementRecord, RiskFlags, ImportResult } from '../types';
import { ImportService } from '../services/ImportService';
import { generateInventoryId, generateHash } from '../utils/stringUtils'; 
import { useAlert } from '../context/AlertContext';
import { OrbitalModal } from './ui/orbital/OrbitalModal';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { mapMovementType } from '../utils/businessRules';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowRight, Play, Database, RefreshCw, XCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: ImportMode;
}

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
              addToast('Warning', 'warning', 'No clear table structure found. Using first row.');
              processTableData(worksheet, 0); 
          } else if (tables.length === 1) {
              processTableData(worksheet, tables[0].rowIndex);
          } else {
              setDetectedTables(tables);
              setSelectedTableIndex(0);
          }
      } catch (err) {
          console.error(err);
          addToast('Error', 'error', 'Failed to analyze sheet.');
      }
  };

  const processTableData = (worksheet: XLSX.WorkSheet, headerRowIndex: number) => {
      try {
        setDetectedRowIndex(headerRowIndex);

        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        const detectedHeaders = rawRows[headerRowIndex] ? rawRows[headerRowIndex].map(String) : [];
        setHeaders(detectedHeaders);

        const rows = XLSX.utils.sheet_to_json<any>(worksheet, { range: headerRowIndex });
        if (rows.length === 0) throw new Error("Empty table.");
        setRawFile(rows);
        
        const suggestions = ImportEngine.suggestMapping(detectedHeaders, rows, mode);
        
        const initialMap: Record<string, string> = {};
        const initialConf: Record<string, number> = {};
        
        Object.entries(suggestions).forEach(([key, val]) => {
            initialMap[key] = val.col;
            initialConf[key] = val.confidence;
        });

        const schema = ImportEngine.getSchema(mode);
        const missingRequired = schema
            .filter(f => f.required && !initialMap[f.key])
            .map(f => f.label);

        if (missingRequired.length > 0) {
            addToast('Attention', 'warning', `Missing required columns: ${missingRequired.join(', ')}. Please map manually.`);
        } else {
            addToast('Success', 'success', 'Columns mapped automatically.');
        }

        setMapping(initialMap);
        setConfidences(initialConf);
        setStep(2); 
      } catch (err) {
        console.error(err);
        addToast('Error', 'error', 'Error processing table data.');
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
        
        if (wb.SheetNames.length === 0) throw new Error("File has no sheets");

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
        addToast('Error', 'error', 'Failed to read file.');
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
              addToast('Selection Required', 'warning', 'Please select a table.');
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
          addToast('Import Blocked', 'error', 'No valid records to import.');
          return;
      }

      try {
            setStage('PARSING');
            await new Promise(r => setTimeout(r, 400));
            const validRows = previewData.filter(r => r.isValid).map(r => r.data);
            
            setStage('HASHING');
            await new Promise(r => setTimeout(r, 400));
            
            if (mode === 'MASTER') {
                const itemsToSave: InventoryItem[] = [];
                const initialHistoryRecords: MovementRecord[] = [];
                const processedIds = new Set();

                validRows.forEach((d) => {
                    const id = generateInventoryId(d.sapCode, d.name, d.lotNumber);
                    
                    if (processedIds.has(id)) return; 
                    processedIds.add(id);

                    const finalRisks: RiskFlags = d.risks || { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false };

                    itemsToSave.push({
                        id,
                        name: d.name || 'Imported Product',
                        sapCode: d.sapCode || '',
                        lotNumber: d.lotNumber || 'GEN',
                        quantity: 0, 
                        baseUnit: d.baseUnit || 'UN',
                        category: d.category || 'General',
                        expiryDate: d.expiryDate || '',
                        location: { warehouse: d.warehouse || 'Central', cabinet: d.cabinet || '', shelf: d.shelf || '', position: d.position || '' },
                        risks: finalRisks,
                        minStockLevel: Number(d.minStockLevel) || 0,
                        supplier: d.supplier || '',
                        type: 'ROH',
                        materialGroup: 'General',
                        itemStatus: 'Active',
                        isControlled: false,
                        casNumber: d.casNumber || '', 
                        lastUpdated: new Date().toISOString(),
                        dateAcquired: new Date().toISOString(),
                        unitCost: 0,
                        currency: 'BRL',
                        batchId: `BAT-${id}`,
                        catalogId: `CAT-${id}`
                    });
                });

                setStage('MERGING');
                const result = await ImportService.importBulk(itemsToSave, replaceMode);
                setImportStats(result);

                if (initialHistoryRecords.length > 0) {
                    await ImportService.importHistoryBulk(initialHistoryRecords, true);
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
                        productName: d.productName || 'Imported Item',
                        sapCode: d.sapCode || '',
                        lot: d.lotNumber || 'GEN',
                        quantity: d.quantity,
                        unit: d.unit || 'UN',
                        observation: d.observation || 'History Import',
                        location_warehouse: d.warehouse || 'Imported',
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
            addToast('Error', 'error', 'Import failed.');
            setStage('IDLE');
      }
  };

  const isTableSelection = detectedTables.length > 1;
  const isUpload = !workbook;

  const StageIndicator = ({ current, target, label }: { current: ProcessingStage, target: ProcessingStage, label: string }) => {
      const isActive = current === target;
      const steps = ['IDLE', 'PARSING', 'HASHING', 'MERGING', 'COMMITTING', 'DONE'];
      const isDone = steps.indexOf(current) > steps.indexOf(target);
      
      let colorClass = "text-orbital-subtext border-orbital-border bg-orbital-bg";
      if (isActive) colorClass = "text-orbital-accent border-orbital-accent bg-orbital-accent/10 animate-pulse";
      if (isDone) colorClass = "text-orbital-success border-orbital-success bg-orbital-success/10";

      return (
          <div className={`flex flex-col items-center gap-2 p-3 border ${colorClass} transition-all w-32`}>
              <span className="font-mono text-[10px] uppercase tracking-wider font-bold">{label}</span>
          </div>
      );
  };

  return (
    <OrbitalModal
        isOpen={isOpen} 
        onClose={onClose} 
        title={`IMPORT ${mode === 'MASTER' ? 'INVENTORY' : 'HISTORY'}`}
        className="max-w-6xl h-[90vh] max-h-[850px] w-full"
    >
        <div className="flex flex-col h-full">
            {/* Steps Indicator */}
            <div className="px-8 py-4 border-b border-orbital-border flex justify-center bg-orbital-surface flex-shrink-0">
                 <div className="flex items-center gap-2">
                    <div className={`size-8 flex items-center justify-center text-sm font-bold font-mono border ${step >= 1 ? 'bg-orbital-accent text-black border-orbital-accent' : 'bg-orbital-bg text-orbital-subtext border-orbital-border'}`}>1</div>
                    <span className="text-xs font-mono uppercase text-orbital-text">Upload</span>
                    <div className="w-12 h-px bg-orbital-border"></div>
                    <div className={`size-8 flex items-center justify-center text-sm font-bold font-mono border ${step >= 2 ? 'bg-orbital-accent text-black border-orbital-accent' : 'bg-orbital-bg text-orbital-subtext border-orbital-border'}`}>2</div>
                    <span className="text-xs font-mono uppercase text-orbital-text">Map</span>
                    <div className="w-12 h-px bg-orbital-border"></div>
                    <div className={`size-8 flex items-center justify-center text-sm font-bold font-mono border ${step >= 3 ? 'bg-orbital-accent text-black border-orbital-accent' : 'bg-orbital-bg text-orbital-subtext border-orbital-border'}`}>3</div>
                    <span className="text-xs font-mono uppercase text-orbital-text">Process</span>
                 </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden flex flex-col p-6 bg-orbital-bg">
                {step === 1 && (
                    <div className="h-full flex flex-col items-center justify-center overflow-y-auto">
                        {isUpload ? (
                            <div className="w-full max-w-2xl h-64 flex flex-col items-center justify-center border border-dashed border-orbital-border bg-orbital-surface hover:bg-orbital-accent/5 transition-colors relative group cursor-pointer">
                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept=".xlsx,.xls,.csv,.xlsm" />
                                <div className="text-orbital-accent mb-4 group-hover:scale-110 transition-transform">
                                    <Upload size={48} strokeWidth={1} />
                                </div>
                                <h3 className="text-lg font-bold text-orbital-text font-display uppercase tracking-wider">Drag & Drop Spreadsheet</h3>
                                <p className="text-orbital-subtext text-xs font-mono mt-2">Supports .xlsx, .xlsm, .xls, .csv</p>
                            </div>
                        ) : isTableSelection ? (
                             <div className="w-full max-w-4xl flex flex-col gap-4 overflow-y-auto">
                                <div className="bg-orbital-warning/10 border border-orbital-warning p-4 flex items-center gap-3 mb-2">
                                    <AlertTriangle className="text-orbital-warning" />
                                    <div>
                                        <h4 className="font-bold text-orbital-warning font-display uppercase text-sm">Multiple Tables Detected</h4>
                                        <p className="text-xs text-orbital-subtext font-mono">Select the data range you wish to import.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {detectedTables.map((table, idx) => (
                                        <div 
                                            key={table.id}
                                            onClick={() => setSelectedTableIndex(idx)}
                                            className={`
                                                cursor-pointer p-4 border transition-all hover:bg-orbital-accent/5
                                                ${selectedTableIndex === idx ? 'border-orbital-accent bg-orbital-accent/10' : 'border-orbital-border bg-orbital-surface'}
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-orbital-subtext">Option {idx + 1}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${table.confidence > 80 ? 'border-orbital-success text-orbital-success' : 'border-orbital-warning text-orbital-warning'}`}>
                                                    {table.confidence}% CONF
                                                </span>
                                            </div>
                                            <div className="text-sm text-orbital-text mb-3 font-mono">
                                                Start Row {table.rowIndex + 1} • ~{table.rowCountEstimate} Records
                                            </div>
                                            <div className="bg-orbital-bg p-2 border border-orbital-border text-[10px] font-mono text-orbital-subtext truncate">
                                                {table.preview.join(' | ')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <OrbitalButton variant="primary" fullWidth onClick={handleConfirmSelection} className="mt-4">
                                    CONFIRM SELECTION
                                </OrbitalButton>
                             </div>
                        ) : (
                            <div className="w-full max-w-lg flex flex-col gap-6 text-center">
                                 <div className="bg-orbital-success/10 p-6 rounded-full mx-auto text-orbital-success border border-orbital-success">
                                     <FileSpreadsheet size={48} strokeWidth={1} />
                                 </div>
                                 <div>
                                     <h3 className="text-xl font-bold text-orbital-text font-display uppercase">File Analyzed</h3>
                                     <p className="text-orbital-subtext font-mono text-sm mt-2">
                                         Sheet: <strong className="text-orbital-accent">{selectedSheet}</strong>
                                     </p>
                                 </div>
                                 {availableSheets.length > 1 && (
                                     <div className="flex flex-col gap-2 text-left">
                                         <label className="text-xs font-bold text-orbital-subtext uppercase">Switch Sheet</label>
                                         <select 
                                            value={selectedSheet}
                                            onChange={e => { setSelectedSheet(e.target.value); analyzeSheet(workbook!, e.target.value); }}
                                            className="w-full bg-orbital-surface border border-orbital-border text-orbital-text text-sm p-2 focus:border-orbital-accent focus:outline-none font-mono"
                                         >
                                             {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                     </div>
                                 )}
                                 <OrbitalButton variant="primary" fullWidth onClick={handleConfirmSelection}>CONTINUE TO MAPPING</OrbitalButton>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col gap-6 h-full overflow-y-auto">
                        <div className="bg-orbital-accent/5 border border-orbital-accent/30 p-4 flex items-start gap-3 shrink-0">
                            <Database className="text-orbital-accent" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-orbital-accent font-display uppercase">Header Detected (Row {detectedRowIndex + 1})</h4>
                                <p className="text-xs text-orbital-subtext font-mono mt-1">
                                    System has analyzed data structure to suggest optimal mapping.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                            {schema.map(field => {
                                const selectedHeader = mapping[field.key] || '';
                                const confidence = confidences[field.key] || 0;
                                const isMapped = !!selectedHeader;
                                
                                return (
                                    <div key={field.key} className={`p-3 border flex flex-col gap-2 transition-colors ${isMapped ? 'bg-orbital-surface border-orbital-border' : 'bg-orbital-bg border-dashed border-orbital-border'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-orbital-text uppercase tracking-wider flex items-center gap-1">
                                                {field.label} {field.required && <span className="text-orbital-danger" title="Required">*</span>}
                                            </span>
                                            {isMapped && (
                                                <span className={`text-[10px] px-1.5 border ${confidence > 80 ? 'border-orbital-success text-orbital-success' : 'border-orbital-subtext text-orbital-subtext'}`}>
                                                    {confidence}% MATCH
                                                </span>
                                            )}
                                        </div>
                                        <select 
                                            value={selectedHeader} 
                                            onChange={(e) => setMapping(prev => ({...prev, [field.key]: e.target.value}))}
                                            className={`w-full text-xs bg-orbital-bg border ${isMapped ? 'border-orbital-accent/50 text-orbital-accent' : 'border-orbital-border text-orbital-subtext'} p-2 focus:outline-none focus:border-orbital-accent font-mono`}
                                        >
                                            <option value="">(Skip Column)</option>
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
                            <div className="flex items-center gap-4 absolute inset-0 z-50 bg-orbital-bg/95 flex-col justify-center backdrop-blur-sm">
                                <h3 className="text-2xl font-bold text-orbital-accent font-display uppercase tracking-widest animate-pulse mb-8">PROCESSING DATA STREAM...</h3>
                                <div className="flex gap-4">
                                    <StageIndicator current={stage} target="PARSING" label="Parsing" />
                                    <div className="h-px w-8 bg-orbital-border self-center"></div>
                                    <StageIndicator current={stage} target="HASHING" label="Indexing" />
                                    <div className="h-px w-8 bg-orbital-border self-center"></div>
                                    <StageIndicator current={stage} target="MERGING" label="Merging" />
                                    <div className="h-px w-8 bg-orbital-border self-center"></div>
                                    <StageIndicator current={stage} target="COMMITTING" label="Saving" />
                                </div>
                            </div>
                        )}

                        {stage === 'DONE' && importStats ? (
                            <div className="w-full max-w-3xl flex flex-col gap-6 animate-in zoom-in-95 duration-300">
                                <div className="text-center border border-orbital-success bg-orbital-success/5 p-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-orbital-success"></div>
                                    <div className="inline-flex p-4 border border-orbital-success rounded-full text-orbital-success mb-4 bg-orbital-success/10">
                                        <CheckCircle size={48} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-orbital-text font-display uppercase tracking-widest">IMPORT COMPLETE</h2>
                                    <p className="text-orbital-subtext font-mono mt-2">Database successfully synchronized.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-orbital-surface border border-orbital-border p-4 flex flex-col items-center">
                                        <span className="text-2xl font-bold text-orbital-success font-mono">{importStats.created}</span>
                                        <span className="text-xs text-orbital-subtext uppercase tracking-wider">New Items</span>
                                    </div>
                                    <div className="bg-orbital-surface border border-orbital-border p-4 flex flex-col items-center">
                                        <span className="text-2xl font-bold text-orbital-accent font-mono">{importStats.updated}</span>
                                        <span className="text-xs text-orbital-subtext uppercase tracking-wider">Updated</span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-center mt-4">
                                    <OrbitalButton onClick={onClose} variant="primary" size="lg">RETURN TO INVENTORY</OrbitalButton>
                                </div>
                            </div>
                        ) : (
                            /* PRE-IMPORT CONFIG */
                            <div className="w-full h-full flex flex-col gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                                    <div className="bg-orbital-surface border border-l-4 border-orbital-accent p-4 border-y-orbital-border border-r-orbital-border">
                                        <div className="text-xs text-orbital-subtext uppercase tracking-wider">Total Detected</div>
                                        <div className="text-2xl font-bold text-orbital-text font-mono">{stats.total}</div>
                                    </div>
                                    <div className="bg-orbital-surface border border-l-4 border-orbital-success p-4 border-y-orbital-border border-r-orbital-border">
                                        <div className="text-xs text-orbital-subtext uppercase tracking-wider">Valid Records</div>
                                        <div className="text-2xl font-bold text-orbital-text font-mono">{stats.valid}</div>
                                    </div>
                                    <div className="bg-orbital-surface border border-l-4 border-orbital-danger p-4 border-y-orbital-border border-r-orbital-border">
                                        <div className="text-xs text-orbital-subtext uppercase tracking-wider">Validation Errors</div>
                                        <div className="text-2xl font-bold text-orbital-text font-mono">{stats.error}</div>
                                    </div>
                                </div>
                                
                                <div className="bg-orbital-surface p-6 border border-orbital-border flex flex-col gap-4 shrink-0">
                                    <h4 className="text-sm font-bold text-orbital-text font-display uppercase tracking-wider mb-1">Import Strategy</h4>
                                    
                                    {mode === 'MASTER' && (
                                        <div className="flex flex-col gap-3">
                                             <label className={`flex items-start gap-3 p-3 border cursor-pointer transition-all ${!replaceMode ? 'border-orbital-accent bg-orbital-accent/5' : 'border-orbital-border hover:bg-orbital-accent/5'}`}>
                                                <input type="radio" checked={!replaceMode} onChange={() => setReplaceMode(false)} className="mt-1 text-orbital-accent bg-transparent border-orbital-border focus:ring-0" />
                                                <div>
                                                    <span className="font-bold text-orbital-text text-sm uppercase tracking-wide block">Smart Merge (Recommended)</span>
                                                    <span className="text-xs text-orbital-subtext font-mono">
                                                        Updates existing balances and creates new items. Preserves manually enriched data.
                                                    </span>
                                                </div>
                                            </label>

                                            <label className={`flex items-start gap-3 p-3 border cursor-pointer transition-all ${replaceMode ? 'border-orbital-danger bg-orbital-danger/5' : 'border-orbital-border hover:bg-orbital-danger/5'}`}>
                                                <input type="radio" checked={replaceMode} onChange={() => setReplaceMode(true)} className="mt-1 text-orbital-danger bg-transparent border-orbital-border focus:ring-0" />
                                                <div>
                                                    <span className="font-bold text-orbital-danger text-sm uppercase tracking-wide block">Total Wipe & Load</span>
                                                    <span className="text-xs text-orbital-subtext font-mono">
                                                        WARNING: ERASES entire database before import. Use only for full system reload.
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
                                                className="mt-1 appearance-none w-4 h-4 border border-orbital-accent checked:bg-orbital-accent cursor-pointer"
                                            />
                                            <label htmlFor="updateStock" className="cursor-pointer">
                                                <span className="text-sm font-bold text-orbital-text uppercase tracking-wide">Update Stock Balances</span>
                                                <p className="text-xs text-orbital-subtext font-mono">
                                                    Recalculates item balances based on these history records.
                                                </p>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Preview Data Grid */}
                                <div className="flex-1 overflow-hidden border border-orbital-border bg-orbital-bg relative flex flex-col">
                                    <div className="absolute top-2 right-2 z-20">
                                        <button 
                                            onClick={() => setShowErrorsOnly(!showErrorsOnly)}
                                            className={`text-[10px] px-3 py-1 font-bold font-mono uppercase tracking-wider border ${showErrorsOnly ? 'bg-orbital-danger text-black border-orbital-danger' : 'bg-orbital-surface text-orbital-subtext border-orbital-border'}`}
                                        >
                                            {showErrorsOnly ? 'Showing Errors Only' : 'Show Errors'}
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs whitespace-nowrap text-orbital-text">
                                            <thead className="bg-orbital-bg border-b border-orbital-border sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-orbital-subtext font-display w-24">Status</th>
                                                    {schema.map(f => <th key={f.key} className="px-4 py-3 font-bold uppercase tracking-wider text-orbital-subtext font-display">{f.label}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-orbital-border/30">
                                                {displayedData.map((row, i) => (
                                                    <tr key={i} className={!row.isValid ? 'bg-orbital-danger/5' : ''}>
                                                        <td className="px-4 py-2 font-mono">
                                                            {row.isValid ? (
                                                                <span className="text-orbital-success flex items-center gap-1"><CheckCircle size={12} /> OK</span>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <span className="text-orbital-danger flex items-center gap-1"><XCircle size={12} /> ERR</span>
                                                                    <span className="text-[10px] text-orbital-danger opacity-70 truncate max-w-[100px]" title={row.errors.join(', ')}>{row.errors[0]}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        {schema.map(f => (
                                                            <td key={f.key} className="px-4 py-2 max-w-[150px] truncate font-mono text-orbital-subtext" title={String(row.data[f.key])}>
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

            <div className="px-6 py-4 border-t border-orbital-border bg-orbital-surface flex justify-between flex-shrink-0">
                {step > 1 && stage === 'IDLE' ? (
                     <OrbitalButton variant="secondary" onClick={() => setStep(step - 1)}>Back</OrbitalButton>
                ) : <div></div>}
                
                {step === 2 && (
                    <OrbitalButton
                        variant="primary"
                        onClick={() => setStep(step + 1)} 
                        disabled={Object.values(mapping).filter(Boolean).length === 0}
                    >
                        VALIDATE DATA <ArrowRight size={16} className="ml-2" />
                    </OrbitalButton>
                )}
                
                {step === 3 && stage === 'IDLE' && (
                    <div className="flex items-center gap-4">
                        <OrbitalButton
                            variant={replaceMode ? 'danger' : 'success'}
                            onClick={runPipeline}
                            disabled={stats.valid === 0}
                        >
                            {replaceMode ? <RefreshCw size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                            {replaceMode ? 'INITIATE WIPE & LOAD' : 'EXECUTE IMPORT'}
                        </OrbitalButton>
                    </div>
                )}
            </div>
        </div>
    </OrbitalModal>
  );
};
