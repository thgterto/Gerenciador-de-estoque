import React, { useState, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { Modal } from './ui/Modal';
import { ImportEngine } from '../utils/ImportEngine';
import { useStockOperations } from '../hooks/useStockOperations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import {
    Box,
    Button,
    Typography,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Radio,
    RadioGroup,
    FormControlLabel,
    Checkbox,
    Alert,
    LinearProgress,
    Stack,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Tooltip
} from '@mui/material';

// Icons
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'MASTER' | 'HISTORY';
}

export const ImportWizard: React.FC<Props> = ({ isOpen, onClose, initialMode = 'MASTER' }) => {
    const { importLegacyExcel } = useStockOperations();

    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<'MASTER' | 'HISTORY'>(initialMode);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [validationResults, setValidationResults] = useState<any[]>([]);
    const [stage, setStage] = useState<'IDLE' | 'VALIDATING' | 'IMPORTING' | 'DONE'>('IDLE');
    const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
    const [replaceMode, setReplaceMode] = useState(false);
    const [showErrorsOnly, setShowErrorsOnly] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFile(null);
            setMode(initialMode);
            setMapping({});
            setValidationResults([]);
            setStage('IDLE');
        }
    }, [isOpen, initialMode]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            const data = await f.arrayBuffer();
            const wb = read(data);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonData = utils.sheet_to_json(ws, { header: 1 });

            if (jsonData.length > 0) {
                const headerRow = jsonData[0] as string[];
                setHeaders(headerRow);

                // Manual mapping suggestion basic
                const autoMap: Record<string, string> = {};
                const schema = ImportEngine.getSchema(mode);

                headerRow.forEach(h => {
                    const norm = h.toLowerCase().trim();
                    const match = schema.find((f: any) => f.aliases && f.aliases.some((a: string) => norm.includes(a)));
                    if (match) autoMap[match.key] = h;
                });

                setMapping(autoMap);
                setPreviewData(utils.sheet_to_json(ws));
            }
        }
    };

    const validateData = async () => {
        setStage('VALIDATING');
        setStep(3);

        setTimeout(() => {
            const results = previewData.map(row => {
                return ImportEngine.processRow(row, mapping, mode);
            });
            
            setValidationResults(results);
            setStats({
                total: results.length,
                valid: results.filter(r => r.isValid).length,
                invalid: results.filter(r => !r.isValid).length
            });
            setStage('IDLE');
        }, 500);
    };

    const runPipeline = async () => {
        setStage('IMPORTING');
        try {
            if (mode === 'MASTER') {
                if (file) {
                   await importLegacyExcel(file);
                }
            }
            setStage('DONE');
        } catch (e) {
            console.error(e);
            setStage('IDLE');
        }
    };

    const schema = ImportEngine.getSchema(mode);
    const displayedData = showErrorsOnly ? validationResults.filter(r => !r.isValid) : validationResults;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Assistente de Importação"
            hideHeader
        >
            <Box sx={{ width: '100%', mb: 4 }}>
                 <Stepper activeStep={step - 1} alternativeLabel>
                    <Step><StepLabel>Upload</StepLabel></Step>
                    <Step><StepLabel>Mapeamento</StepLabel></Step>
                    <Step><StepLabel>Validação</StepLabel></Step>
                    <Step><StepLabel>Conclusão</StepLabel></Step>
                </Stepper>
            </Box>

            <Box sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
                {step === 1 && (
                    <Stack spacing={3} alignItems="center" justifyContent="center" height="100%">
                        <FormControl fullWidth sx={{ maxWidth: 300 }}>
                            <InputLabel>Tipo de Importação</InputLabel>
                            <Select
                                value={mode}
                                label="Tipo de Importação"
                                onChange={(e) => setMode(e.target.value as any)}
                            >
                                <MenuItem value="MASTER">Cadastro de Itens (Master Data)</MenuItem>
                                <MenuItem value="HISTORY">Histórico de Movimentação</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadFileIcon />}
                            sx={{ p: 4, borderStyle: 'dashed', borderWidth: 2, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}
                        >
                            <Typography variant="h6">Clique para selecionar arquivo Excel</Typography>
                            <Typography variant="caption" color="text.secondary">Formatos suportados: .xlsx, .xls</Typography>
                            <input type="file" hidden accept=".xlsx,.xls" onChange={handleFile} />
                        </Button>
                    </Stack>
                )}

                {step === 2 && (
                    <Stack spacing={2} height="100%">
                        <Alert severity="info" sx={{ py: 0 }}>
                            Associe as colunas do seu Excel aos campos do sistema.
                        </Alert>
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            {schema.map((field: any) => (
                                <Box key={field.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, p: 1, borderBottom: 1, borderColor: 'divider' }}>
                                    <Box>
                                        <Typography variant="subtitle2">{field.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">{field.required ? 'Obrigatório' : 'Opcional'}</Typography>
                                    </Box>
                                    <Select
                                        size="small"
                                        value={mapping[field.key] || ''}
                                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                                        displayEmpty
                                        sx={{ minWidth: 200 }}
                                    >
                                        <MenuItem value=""><em>Ignorar</em></MenuItem>
                                        {headers.map(h => (
                                            <MenuItem key={h} value={h}>{h}</MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                            ))}
                        </Box>
                    </Stack>
                )}

                {step === 3 && (
                     <Stack spacing={2} height="100%">
                         <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box flex={1}>
                                <Typography variant="h6">Validação de Dados</Typography>
                                <Stack direction="row" spacing={2} mt={1}>
                                    <Chip label={`${stats.total} Registros`} size="small" />
                                    <Chip label={`${stats.valid} Válidos`} color="success" size="small" icon={<CheckCircleIcon />} />
                                    <Chip label={`${stats.invalid} Inválidos`} color="error" size="small" icon={<ErrorIcon />} />
                                </Stack>
                            </Box>

                            {mode === 'MASTER' && (
                                <FormControl component="fieldset">
                                    <RadioGroup row value={replaceMode} onChange={(e) => setReplaceMode(e.target.value === 'true')}>
                                        <FormControlLabel value={false} control={<Radio />} label="Smart Merge" />
                                        <FormControlLabel value={true} control={<Radio color="error" />} label="Substituir Tudo" />
                                    </RadioGroup>
                                </FormControl>
                            )}
                         </Box>

                         <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                             <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderBottom: 1, borderColor: 'divider' }}>
                                 <FormControlLabel
                                    control={<Checkbox checked={showErrorsOnly} onChange={(e) => setShowErrorsOnly(e.target.checked)} size="small" />}
                                    label="Mostrar Apenas Erros"
                                 />
                             </Box>
                             <Table containerClassName="flex-1 overflow-auto">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        {schema.map((f: any) => <TableHead key={f.key}>{f.label}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedData.map((row, i) => (
                                        <TableRow key={i} sx={{ bgcolor: !row.isValid ? 'error.lighter' : 'inherit' }}>
                                            <TableCell>
                                                {row.isValid ? <CheckCircleIcon color="success" fontSize="small" /> : (
                                                    <Tooltip title={row.errors.join(', ')}>
                                                        <ErrorIcon color="error" fontSize="small" />
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                            {schema.map((f: any) => (
                                                <TableCell key={f.key}>
                                                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                                        {String(row.data[f.key] || '')}
                                                    </Typography>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                         </Paper>

                         {stage === 'IMPORTING' && <LinearProgress />}

                         {stage === 'DONE' && (
                             <Alert severity="success">
                                 Importação concluída com sucesso!
                             </Alert>
                         )}
                     </Stack>
                )}
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                 {step > 1 && stage === 'IDLE' ? (
                     <Button onClick={() => setStep(step - 1)}>Voltar</Button>
                 ) : <div />}

                 {step === 2 && (
                     <Button variant="contained" onClick={validateData} disabled={Object.keys(mapping).length === 0}>
                         Validar Dados
                     </Button>
                 )}

                 {step === 3 && stage === 'IDLE' && (
                     <Button
                        variant="contained"
                        color={replaceMode ? 'error' : 'primary'}
                        onClick={runPipeline}
                        disabled={stats.valid === 0}
                        startIcon={<PlayArrowIcon />}
                     >
                         {replaceMode ? 'Iniciar Substituição' : 'Iniciar Importação'}
                     </Button>
                 )}

                 {stage === 'DONE' && (
                     <Button variant="contained" onClick={onClose}>Fechar</Button>
                 )}
            </Box>
        </Modal>
    );
};
