import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { InventoryService } from '../services/InventoryService';
import { ImportService } from '../services/ImportService';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { seedDatabase } from '../services/DatabaseSeeder'; 
import { GOOGLE_CONFIG } from '../config/apiConfig';
import { useAlert } from '../context/AlertContext';
import { ApiClient } from '../services/ApiClient';
import { ImportWizard } from './ImportWizard';
import { ImportMode } from '../utils/ImportEngine';
import { ExportEngine } from '../utils/ExportEngine';

// Orbital UI
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalModal } from './ui/orbital/OrbitalModal';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { OrbitalPageHeader } from './ui/orbital/OrbitalPageHeader';

// Icons
import {
    Upload,
    History,
    Sparkles,
    ClipboardCheck,
    AlertOctagon,
    Sheet,
    Wifi,
    WifiOff,
    Save,
    RefreshCcw,
    Download,
    HardDrive,
    Code,
    BookmarkPlus,
    RotateCcw,
    Trash2,
    Database,
    FileSpreadsheet,
    ShieldAlert,
    AlertTriangle
} from 'lucide-react';

export const Settings: React.FC = () => {
    const { addToast } = useAlert();
    const [loading, setLoading] = useState(false);
    const isElectron = ApiClient.isElectron();
    
    // Cloud Config
    const [googleUrl, setGoogleUrl] = useState('');
    const [isCloudConnected, setIsCloudConnected] = useState(false);

    // Enrichment State
    const [enriching, setEnriching] = useState(false);
    const [enrichProgress, setEnrichProgress] = useState(0);
    const [enrichTotal, setEnrichTotal] = useState(0);
    
    // Import Wizard State
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardMode, setWizardMode] = useState<ImportMode>('MASTER');

    // Reset & Seed State
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const [resetTargetMode, setResetTargetMode] = useState<'EMPTY' | 'RELOAD' | null>(null);
    const [hasCustomSeed, setHasCustomSeed] = useState(false);

    // Audit State
    const [auditStats, setAuditStats] = useState<{ matches: number, mismatches: number, corrections: number } | null>(null);

    useEffect(() => {
        // Init Cloud Config
        const url = GOOGLE_CONFIG.getWebUrl();
        setGoogleUrl(url);
        if (url) checkConnection();

        // Check for Custom Seed
        checkCustomSeed();
    }, []);

    const checkConnection = async () => {
        const connected = await GoogleSheetsService.testConnection();
        setIsCloudConnected(connected);
    };

    const checkCustomSeed = async () => {
        try {
            const seed = await db.rawDb.systemConfigs.get('custom_seed');
            setHasCustomSeed(!!seed);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveGoogleConfig = async () => {
        let cleanUrl = googleUrl.trim();
        
        if (!cleanUrl) {
            addToast('URL Inválida', 'warning', 'Preencha a URL do Google Web App.');
            return;
        }

        if (cleanUrl.includes('/edit')) {
            addToast('URL Corrigida', 'info', 'Detectamos um link de edição. Tentando converter para link de execução...');
            cleanUrl = cleanUrl.split('/edit')[0] + '/exec';
            setGoogleUrl(cleanUrl);
        } else if (!cleanUrl.endsWith('/exec')) {
             if (!cleanUrl.endsWith('/')) cleanUrl += '/';
             if (!cleanUrl.includes('exec')) cleanUrl += 'exec';
             setGoogleUrl(cleanUrl);
        }

        setLoading(true);
        GOOGLE_CONFIG.setWebUrl(cleanUrl);
        
        const success = await GoogleSheetsService.testConnection();
        setIsCloudConnected(success);
        setLoading(false);
        
        if (success) {
            addToast('Conectado', 'success', 'Conexão com Google Sheets estabelecida!');
        } else {
            addToast('Erro de Conexão', 'error', 'Não foi possível contatar o script. Verifique se implantou como "Web App" e acesso "Qualquer pessoa".');
        }
    };

    const handleSync = async () => {
        if (!isCloudConnected) {
            addToast('Offline', 'error', 'Configure e salve a URL do Google Sheets primeiro.');
            return;
        }
        
        if (!confirm("Atenção: A sincronização irá baixar os dados da nuvem e mesclar com os locais. Em caso de conflito, os dados da nuvem prevalecerão. Continuar?")) {
            return;
        }

        setLoading(true);
        try {
            await InventoryService.syncFromCloud();
            addToast('Sincronizado', 'success', 'Dados atualizados da nuvem.');
        } catch (e: any) {
            console.error(e);
            addToast('Erro', 'error', 'Falha na sincronização. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async (isTemplate = false) => {
        setLoading(true);
        setTimeout(async () => {
            try {
                await InventoryService.exportData({ includeHistory: !isTemplate, format: 'xlsx' });
                addToast('Exportação Concluída', 'success', 'Arquivo Excel gerado com sucesso.');
            } catch (error) {
                console.error(error);
                addToast('Erro na Exportação', 'error', 'Falha ao gerar arquivo.');
            } finally {
                setLoading(false);
            }
        }, 100);
    };

    const handleDownloadSeed = async () => {
        setLoading(true);
        try {
            await ExportEngine.generateLimsSeedFile();
            addToast('Seed Gerado', 'success', 'Arquivo limsData.ts baixado.');
        } catch (e) {
            console.error(e);
            addToast('Erro', 'error', 'Falha ao gerar arquivo de seed.');
        } finally {
            setLoading(false);
        }
    };

    const handlePortableBackup = async () => {
        setLoading(true);
        try {
            const res = await ApiClient.backupDatabase();
            if (res.success) {
                addToast('Backup Completo', 'success', `Banco de dados salvo em: ${res.data?.path || 'Pasta selecionada'}`);
            } else if (res.error !== 'Cancelled by user') {
                addToast('Erro no Backup', 'error', res.error || 'Falha desconhecida');
            }
        } catch (e) {
            console.error(e);
            addToast('Erro', 'error', 'Falha ao executar backup.');
        } finally {
            setLoading(false);
        }
    };

    const handleSetCurrentAsDefault = async () => {
        if (!confirm("Isso salvará o estado ATUAL do banco de dados como o novo padrão de 'Reset'. Tem certeza?")) return;

        setLoading(true);
        try {
            const seedData = await ExportEngine.generateSeedObject();
            await db.rawDb.systemConfigs.put({
                key: 'custom_seed',
                category: 'system',
                value: JSON.stringify(seedData)
            });
            setHasCustomSeed(true);
            addToast('Padrão Atualizado', 'success', 'O estado atual foi salvo como ponto de restauração.');
        } catch (e) {
            console.error(e);
            addToast('Erro ao Salvar', 'error', 'Falha ao persistir configuração.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreFactory = async () => {
        if (!confirm("Isso apagará o ponto de restauração personalizado e voltará ao padrão de fábrica (limsData original). Continuar?")) return;

        setLoading(true);
        try {
            await db.rawDb.systemConfigs.delete('custom_seed');
            setHasCustomSeed(false);
            addToast('Restaurado', 'success', 'Padrão de fábrica restaurado. Faça um Reset para aplicar.');
        } catch (e) {
            console.error(e);
            addToast('Erro', 'error', 'Falha ao excluir configuração.');
        } finally {
            setLoading(false);
        }
    };

    const openResetModal = (mode: 'EMPTY' | 'RELOAD') => {
        setResetTargetMode(mode);
        setResetConfirmationText('');
        setResetModalOpen(true);
    };

    const handleExecuteReset = async () => {
        if (resetConfirmationText.toUpperCase() !== 'DELETAR') {
            addToast('Erro de Confirmação', 'error', 'Digite a palavra corretamente para confirmar.');
            return;
        }

        setLoading(true);
        setResetModalOpen(false);

        try {
            await db.clearData(); 

            localStorage.removeItem('LC_SKIP_AUTO_SEED');

            await seedDatabase(true);

            addToast('Reiniciando...', 'success', 'O sistema será recarregado.');
            setTimeout(() => {
                window.location.reload(); 
            }, 1500);

        } catch (e) {
            console.error("Erro ao resetar:", e);
            addToast('Erro Crítico', 'error', 'Falha ao resetar. Tente recarregar a página.');
            setLoading(false);
        }
    };
    
    const handleRunAudit = async (shouldFix: boolean = false) => {
        setLoading(true);
        try {
            const stats = await InventoryService.runLedgerAudit(shouldFix);
            setAuditStats(stats);
            if (stats.mismatches === 0) {
                 addToast('Integridade Verificada', 'success', 'Todos os saldos estão sincronizados.');
            } else {
                 if (shouldFix) {
                     addToast('Correção Aplicada', 'success', `${stats.corrections} saldos corrigidos no Ledger V2.`);
                 } else {
                     addToast('Divergência Detectada', 'warning', `${stats.mismatches} itens com saldo divergente.`);
                 }
            }
        } catch (e) {
            addToast('Erro na Auditoria', 'error', 'Falha ao verificar integridade.');
        } finally {
            setLoading(false);
        }
    };

    const handleEnrichment = async () => {
        setEnriching(true);
        setEnrichProgress(0);
        
        setTimeout(async () => {
            try {
                addToast('Iniciando Enriquecimento', 'info', 'Consultando API CAS Common Chemistry...');
                const result = await ImportService.enrichInventory((current, total) => {
                    setEnrichProgress(current);
                    setEnrichTotal(total);
                });
                
                if (result.total === 0) {
                     addToast('Nada a Atualizar', 'info', 'Todos os itens com CAS já possuem dados atualizados.');
                } else {
                     addToast('Sucesso', 'success', `${result.updated} itens atualizados com dados de segurança.`);
                }
            } catch (e) {
                console.error(e);
                addToast('Erro', 'error', 'Falha ao conectar com serviço CAS.');
            } finally {
                setEnriching(false);
                setEnrichProgress(0);
            }
        }, 100);
    };

    const openWizard = (mode: ImportMode) => {
        setWizardMode(mode);
        setWizardOpen(true);
    };

    return (
        <div className="flex flex-col gap-8 pb-20">
            <OrbitalPageHeader
                title="Configurações e Sistema"
                description="Controle avançado de dados e integrações."
                breadcrumbs={[{ label: 'Configurações' }]}
            />

            {/* Grid Layout Responsivo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* Coluna 1: Operações de Dados */}
                <div className="flex flex-col gap-6">
                    <OrbitalCard title="Importação e Carga" action={<Database size={16} className="text-orbital-primary" />}>
                        <div className="flex flex-col gap-3">
                            <OrbitalButton onClick={() => openWizard('MASTER')} variant="secondary" size="md" className="w-full justify-start gap-3" startIcon={<Upload size={16} />}>
                                Importar Inventário (Planilha)
                            </OrbitalButton>
                            <OrbitalButton onClick={() => openWizard('HISTORY')} variant="secondary" size="md" className="w-full justify-start gap-3" startIcon={<History size={16} />}>
                                Importar Histórico
                            </OrbitalButton>
                        </div>
                    </OrbitalCard>

                    <OrbitalCard title="Enriquecimento de Dados" action={<Sparkles size={16} className="text-orbital-accent" />}>
                        <p className="text-sm text-gray-400 mb-4 font-mono">
                            // Busca automática de dados CAS (Fórmula, Peso, Riscos) na API Common Chemistry.
                        </p>
                        {enriching ? (
                            <div className="w-full space-y-2">
                                <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                                    <div className="bg-orbital-accent h-full transition-all duration-300 shadow-[0_0_10px_#f59e0b]" style={{ width: `${(enrichProgress/enrichTotal)*100}%` }}></div>
                                </div>
                                <p className="text-[10px] font-mono text-center text-orbital-accent uppercase tracking-widest animate-pulse">
                                    Processando {enrichProgress} / {enrichTotal}
                                </p>
                            </div>
                        ) : (
                            <OrbitalButton onClick={handleEnrichment} variant="primary" size="md" className="w-full" startIcon={<Sparkles size={16} />}>
                                Iniciar Enriquecimento CAS
                            </OrbitalButton>
                        )}
                    </OrbitalCard>

                    <OrbitalCard title="Auditoria de Integridade" action={<ClipboardCheck size={16} className="text-orbital-success" />}>
                        <p className="text-sm text-gray-400 mb-4 font-mono">
                            // Verifica consistência entre saldo visual e histórico (Ledger).
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <OrbitalButton onClick={() => handleRunAudit(false)} variant="secondary" disabled={loading} className="flex-1" startIcon={<AlertOctagon size={16} />}>
                                Verificar
                            </OrbitalButton>
                            {auditStats && auditStats.mismatches > 0 && (
                                <OrbitalButton onClick={() => handleRunAudit(true)} variant="danger" disabled={loading} className="flex-1" startIcon={<RefreshCcw size={16} />}>
                                    Corrigir ({auditStats.mismatches})
                                </OrbitalButton>
                            )}
                        </div>

                        {auditStats && (
                            <div className={`mt-4 p-3 rounded border text-sm font-mono ${auditStats.mismatches > 0 ? 'bg-orbital-danger/10 border-orbital-danger text-orbital-danger' : 'bg-orbital-success/10 border-orbital-success text-orbital-success'}`}>
                                <p className="font-bold flex items-center gap-2 uppercase tracking-wide">
                                    {auditStats.mismatches > 0 ? 'Divergência Detectada' : 'Sistema Íntegro'}
                                </p>
                                <ul className="list-disc pl-6 mt-1 text-xs opacity-90 space-y-1">
                                    <li>Sincronizados: {auditStats.matches}</li>
                                    <li>Divergências: {auditStats.mismatches}</li>
                                    {auditStats.corrections > 0 && <li>Corrigidos: {auditStats.corrections}</li>}
                                </ul>
                            </div>
                        )}
                    </OrbitalCard>
                </div>

                {/* Coluna 2: Integração e Sistema */}
                <div className="flex flex-col gap-6">
                    {/* Google Sheets */}
                    <OrbitalCard
                        title="Google Sheets Sync"
                        action={isCloudConnected ? <Wifi size={16} className="text-orbital-success" /> : <WifiOff size={16} className="text-gray-500" />}
                        className="border-l-4 border-l-green-500"
                    >
                         <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-900/30 rounded text-green-400 border border-green-800">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-green-400 uppercase tracking-wide">Integração Apps Script</h3>
                                <p className="text-[10px] text-gray-500 font-mono">STATUS: {isCloudConnected ? 'ONLINE' : 'OFFLINE'}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <OrbitalInput
                                label="URL do Web App"
                                value={googleUrl}
                                onChange={e => setGoogleUrl(e.target.value)}
                                placeholder="https://script.google.com/..."
                                startIcon={<Sheet size={16} />}
                                fullWidth
                            />
                            <div className="flex gap-3">
                                <OrbitalButton onClick={handleSaveGoogleConfig} variant="primary" disabled={loading} className="flex-1" startIcon={<Save size={16} />}>
                                    Conectar
                                </OrbitalButton>
                                <OrbitalButton onClick={handleSync} variant="secondary" disabled={!isCloudConnected || loading} className="flex-1" startIcon={<RefreshCcw size={16} />}>
                                    Sincronizar
                                </OrbitalButton>
                            </div>
                        </div>
                    </OrbitalCard>

                    {/* Backup e Seed */}
                    <OrbitalCard title="Backup e Padrões" action={<HardDrive size={16} />}>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Exportação</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <OrbitalButton
                                        onClick={() => handleExportExcel(false)}
                                        disabled={loading}
                                        variant="secondary"
                                        size="sm"
                                        startIcon={<Download size={14} />}
                                    >
                                        Excel (.xlsx)
                                    </OrbitalButton>
                                    {isElectron ? (
                                        <OrbitalButton
                                            onClick={handlePortableBackup}
                                            disabled={loading}
                                            variant="primary"
                                            size="sm"
                                            startIcon={<Save size={14} />}
                                        >
                                            Backup Full (.db)
                                        </OrbitalButton>
                                    ) : (
                                        <OrbitalButton
                                            onClick={handleDownloadSeed}
                                            disabled={loading}
                                            variant="secondary"
                                            size="sm"
                                            startIcon={<Code size={14} />}
                                        >
                                            Baixar Seed
                                        </OrbitalButton>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-800 pb-1">Ponto de Restauração</p>

                                {hasCustomSeed ? (
                                    <div className="bg-orbital-primary/5 p-3 rounded border border-orbital-primary/20 mb-3 flex gap-3 items-center">
                                        <BookmarkPlus size={20} className="text-orbital-primary" />
                                        <div>
                                            <p className="text-xs font-bold text-orbital-primary uppercase">Seed Personalizado Ativo</p>
                                            <p className="text-[10px] text-gray-400 font-mono">O sistema usará seus dados salvos como ponto de reset.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700 mb-3 flex gap-3 items-center">
                                        <Database size={20} className="text-gray-500" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">Padrão de Fábrica</p>
                                            <p className="text-[10px] text-gray-600 font-mono">Usando dados originais do sistema.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <OrbitalButton
                                        onClick={handleSetCurrentAsDefault}
                                        disabled={loading}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-orbital-primary border border-orbital-primary/30 hover:bg-orbital-primary/10"
                                        startIcon={<BookmarkPlus size={14} />}
                                    >
                                        Definir Estado Atual como Padrão
                                    </OrbitalButton>

                                    {hasCustomSeed && (
                                        <OrbitalButton
                                            onClick={handleRestoreFactory}
                                            disabled={loading}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-orbital-accent border border-orbital-accent/30 hover:bg-orbital-accent/10"
                                            startIcon={<RotateCcw size={14} />}
                                        >
                                            Voltar ao Padrão de Fábrica
                                        </OrbitalButton>
                                    )}
                                </div>
                            </div>
                        </div>
                    </OrbitalCard>

                    {/* ZONA DE PERIGO */}
                    <OrbitalCard title="Zona de Perigo" className="border-orbital-danger/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" action={<ShieldAlert size={16} className="text-orbital-danger" />}>
                        <div className="flex flex-col gap-3">
                            <OrbitalButton
                                onClick={() => openResetModal('RELOAD')}
                                variant="danger"
                                size="sm"
                                className="w-full justify-start bg-orbital-danger/10 text-orbital-danger border-orbital-danger/30 hover:bg-orbital-danger/20"
                                startIcon={<RotateCcw size={14} />}
                                disabled={loading}
                            >
                                {hasCustomSeed ? 'Resetar para Meu Padrão' : 'Resetar para Padrão de Fábrica'}
                            </OrbitalButton>
                            <OrbitalButton
                                onClick={() => openResetModal('EMPTY')}
                                variant="danger"
                                size="sm"
                                className="w-full justify-start"
                                startIcon={<Trash2 size={14} />}
                                disabled={loading}
                            >
                                Apagar Tudo (Zero)
                            </OrbitalButton>
                        </div>
                    </OrbitalCard>
                </div>
            </div>

            {/* Import Wizard Overlay - Kept Original for now, maybe wrapped */}
            <ImportWizard
                isOpen={wizardOpen}
                onClose={() => setWizardOpen(false)}
                mode={wizardMode}
            />

            {/* Secure Reset Modal */}
            <OrbitalModal
                isOpen={resetModalOpen}
                onClose={() => setResetModalOpen(false)}
                title={resetTargetMode === 'EMPTY' ? "Apagar TUDO?" : "Recarregar Banco?"}
                icon={<ShieldAlert size={24} />}
            >
                <div className="space-y-6">
                    <div className="bg-orbital-danger/10 p-4 rounded border border-orbital-danger/30 flex gap-4 items-start">
                        <AlertTriangle className="text-orbital-danger shrink-0" size={24} />
                        <div className="text-sm text-gray-300 font-mono">
                            <p className="font-bold text-orbital-danger mb-1 uppercase tracking-wider">Ação Destrutiva Detectada</p>
                            {resetTargetMode === 'EMPTY' ? (
                                <p>O sistema será esvaziado completamente. Todos os dados serão perdidos irreversivelmente.</p>
                            ) : (
                                <p>
                                    Os dados atuais serão substituídos pelo ponto de restauração
                                    {hasCustomSeed ? ' (Seu Backup Personalizado)' : ' (Padrão de Fábrica)'}.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">
                            Digite <span className="text-orbital-danger">DELETAR</span> para confirmar:
                        </label>
                        <OrbitalInput
                            value={resetConfirmationText}
                            onChange={e => setResetConfirmationText(e.target.value)}
                            placeholder="DELETAR"
                            className="uppercase text-center text-orbital-danger border-orbital-danger/50 focus:border-orbital-danger"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-orbital-border/50">
                        <OrbitalButton variant="ghost" onClick={() => setResetModalOpen(false)} disabled={loading}>
                            Cancelar
                        </OrbitalButton>
                        <OrbitalButton
                            variant="danger"
                            onClick={handleExecuteReset}
                            disabled={resetConfirmationText.toUpperCase() !== 'DELETAR' || loading}
                            startIcon={<Trash2 size={16} />}
                        >
                            Confirmar Reset
                        </OrbitalButton>
                    </div>
                </div>
            </OrbitalModal>
        </div>
    );
};
