import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { InventoryService } from '../services/InventoryService';
import { ImportService } from '../services/ImportService';
import { seedDatabase } from '../services/DatabaseSeeder'; 
import { useAlert } from '../context/AlertContext';
import { ApiClient } from '../services/ApiClient';
import { ImportWizard } from './ImportWizard';
import { ImportMode } from '../utils/ImportEngine';
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalModal } from './ui/orbital/OrbitalModal';
import { PageContainer } from './ui/PageContainer'; 
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { ExportEngine } from '../utils/ExportEngine';
import { ExcelIntegrationForm } from './ExcelIntegrationForm'; // Mantemos para "Send to Excel"
import { ExcelSetupModal } from './ExcelSetupModal';
import {
    Upload,
    Package,
    History,
    FlaskConical,
    Sparkles,
    ClipboardCheck,
    Search,
    Wrench,
    AlertTriangle,
    CheckCircle,
    Table2,
    Save,
    Download,
    Code,
    BookmarkCheck,
    Factory,
    BookmarkPlus,
    RotateCcw,
    AlertOctagon,
    RotateCw,
    Trash2,
    Settings as SettingsIcon,
    Wifi
} from 'lucide-react';

export const Settings: React.FC = () => {
    const { addToast } = useAlert();
    const [loading, setLoading] = useState(false);
    const isElectron = ApiClient.isElectron();
    
    // Enrichment State
    const [enriching, setEnriching] = useState(false);
    const [enrichProgress, setEnrichProgress] = useState(0);
    const [enrichTotal, setEnrichTotal] = useState(0);
    
    // Import Wizard State
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardMode, setWizardMode] = useState<ImportMode>('MASTER');

    // Excel Setup Modal
    const [excelSetupOpen, setExcelSetupOpen] = useState(false);

    // Reset & Seed State
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const [resetTargetMode, setResetTargetMode] = useState<'EMPTY' | 'RELOAD' | null>(null);
    const [hasCustomSeed, setHasCustomSeed] = useState(false);

    // Audit State
    const [auditStats, setAuditStats] = useState<{ matches: number, mismatches: number, corrections: number } | null>(null);

    useEffect(() => {
        // Check for Custom Seed
        checkCustomSeed();
    }, []);

    const checkCustomSeed = async () => {
        try {
            const seed = await db.rawDb.systemConfigs.get('custom_seed');
            setHasCustomSeed(!!seed);
        } catch (e) {
            console.error(e);
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
            // Limpa dados operacionais (db.clearData NÃO apaga systemConfigs, preservando o Custom Seed)
            await db.clearData(); 

            localStorage.removeItem('LC_SKIP_AUTO_SEED');

            // Se existir um Custom Seed em systemConfigs, seedDatabase(true) irá usá-lo.
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
        <PageContainer scrollable={true} className="pb-20">
            <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
                <div className="flex flex-col gap-2 border-b border-orbital-border pb-6">
                    <h1 className="text-3xl font-display font-black tracking-tight text-orbital-text uppercase">Configurações e Sistema</h1>
                    <p className="text-orbital-subtext text-base max-w-2xl font-mono text-sm">
                        Gerencie importações, integrações com nuvem, backups e redefinições do sistema.
                    </p>
                </div>

                {/* Grid Layout Responsivo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    {/* Coluna 1: Operações de Dados */}
                    <div className="flex flex-col gap-6">
                        <OrbitalCard>
                            <div className="flex items-center gap-3 mb-4 text-orbital-text">
                                <div className="p-2 rounded bg-orbital-accent/10 text-orbital-accent border border-orbital-accent">
                                    <Upload size={24} />
                                </div>
                                <h3 className="text-lg font-bold font-display uppercase tracking-wide">Importação e Carga</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                                <OrbitalButton onClick={() => openWizard('MASTER')} variant="outline" className="w-full justify-start text-sm" icon={<Package size={16} />}>
                                    Importar Inventário (Planilha)
                                </OrbitalButton>
                                <OrbitalButton onClick={() => openWizard('HISTORY')} variant="outline" className="w-full justify-start text-sm" icon={<History size={16} />}>
                                    Importar Histórico
                                </OrbitalButton>
                            </div>
                        </OrbitalCard>

                        <OrbitalCard>
                            <div className="flex items-center gap-3 mb-4 text-orbital-text">
                                <div className="p-2 rounded bg-orbital-accent/10 text-orbital-accent border border-orbital-accent">
                                    <FlaskConical size={24} />
                                </div>
                                <h3 className="text-lg font-bold font-display uppercase tracking-wide">Enriquecimento de Dados</h3>
                            </div>
                            <p className="text-sm text-orbital-subtext mb-4 font-mono">
                                Busca automática de dados químicos (Fórmula, Peso, Riscos) na API CAS para itens com CAS Number.
                            </p>
                            {enriching ? (
                                <div className="w-full space-y-2">
                                    <div className="w-full bg-orbital-bg rounded-none h-2 border border-orbital-border overflow-hidden">
                                        <div className="bg-orbital-accent h-full transition-all duration-300 shadow-glow" style={{ width: `${(enrichProgress/enrichTotal)*100}%` }}></div>
                                    </div>
                                    <p className="text-xs text-center text-orbital-subtext font-mono">{enrichProgress} de {enrichTotal} itens processados</p>
                                </div>
                            ) : (
                                <OrbitalButton onClick={handleEnrichment} variant="primary" icon={<Sparkles size={16} />} className="w-full text-sm">
                                    Enriquecer Itens com CAS
                                </OrbitalButton>
                            )}
                        </OrbitalCard>

                        <OrbitalCard>
                            <div className="flex items-center gap-3 mb-4 text-orbital-text relative z-10">
                                <div className="p-2 bg-purple-900/20 rounded text-purple-400 border border-purple-500/50">
                                    <ClipboardCheck size={24} />
                                </div>
                                <h3 className="text-lg font-bold font-display uppercase tracking-wide">Auditoria de Integridade</h3>
                            </div>
                            <p className="text-sm text-orbital-subtext mb-4 font-mono">
                                Verifica consistência entre saldo visual e histórico (Ledger).
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <OrbitalButton onClick={() => handleRunAudit(false)} variant="outline" icon={<Search size={16} />} disabled={loading} className="flex-1 text-sm">
                                    Verificar
                                </OrbitalButton>
                                {auditStats && auditStats.mismatches > 0 && (
                                    <OrbitalButton onClick={() => handleRunAudit(true)} variant="danger" icon={<Wrench size={16} />} disabled={loading} className="flex-1 text-sm">
                                        Corrigir ({auditStats.mismatches})
                                    </OrbitalButton>
                                )}
                            </div>

                            {auditStats && (
                                <div className={`mt-4 p-3 border text-sm font-mono ${auditStats.mismatches > 0 ? 'bg-orbital-warning/10 border-orbital-warning text-orbital-warning' : 'bg-orbital-success/10 border-orbital-success text-orbital-success'}`}>
                                    <p className="font-bold flex items-center gap-2 uppercase tracking-wide">
                                        {auditStats.mismatches > 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                        Resultado:
                                    </p>
                                    <ul className="list-disc pl-6 mt-1 text-xs space-y-1 opacity-90">
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
                        {/* Excel / Power Automate Integration */}
                        <OrbitalCard className="border-l-4 border-l-[#107C41] relative overflow-hidden">
                             <div className="flex items-center gap-3 mb-4 text-orbital-text relative z-10">
                                <div className="p-2 bg-green-900/20 rounded text-green-400 border border-green-500/50">
                                    <Table2 size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold font-display uppercase tracking-wide">Integração Excel</h3>
                                    <p className="text-xs text-orbital-subtext font-mono">Conecte com Office 365 / Excel Online</p>
                                </div>
                                <OrbitalButton
                                    onClick={() => setExcelSetupOpen(true)}
                                    variant="outline"
                                    icon={<SettingsIcon size={14} />}
                                    className="text-xs"
                                >
                                    Configurar
                                </OrbitalButton>
                            </div>

                            <div className="relative z-10 space-y-4">
                                <div className="bg-green-900/10 border border-green-500/20 p-3 rounded text-xs text-green-300">
                                    Configure o Power Automate para sincronizar dados automaticamente.
                                </div>
                                <ExcelIntegrationForm />
                            </div>
                        </OrbitalCard>

                        {/* Backup e Seed */}
                        <OrbitalCard>
                            <div className="flex items-center gap-3 mb-4 text-orbital-text">
                                <div className="p-2 rounded bg-orbital-surface text-orbital-subtext border border-orbital-border">
                                    <Save size={24} />
                                </div>
                                <h3 className="text-lg font-bold font-display uppercase tracking-wide">Backup e Padrões</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold font-display text-orbital-subtext uppercase mb-2">Exportação</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <OrbitalButton
                                            onClick={() => handleExportExcel(false)}
                                            disabled={loading}
                                            variant="outline"
                                            className="w-full text-sm"
                                            icon={<Download size={16} />}
                                        >
                                            Exportar (.xlsx)
                                        </OrbitalButton>
                                        {isElectron ? (
                                            <OrbitalButton
                                                onClick={handlePortableBackup}
                                                disabled={loading}
                                                variant="primary"
                                                className="w-full text-sm"
                                                icon={<Save size={16} />}
                                            >
                                                Backup Full (.db)
                                            </OrbitalButton>
                                        ) : (
                                            <OrbitalButton
                                                onClick={handleDownloadSeed}
                                                disabled={loading}
                                                variant="outline"
                                                className="w-full text-sm"
                                                icon={<Code size={16} />}
                                            >
                                                Baixar Seed
                                            </OrbitalButton>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-orbital-border">
                                    <p className="text-xs font-bold font-display text-orbital-subtext uppercase mb-2">Ponto de Restauração</p>

                                    {hasCustomSeed ? (
                                        <div className="bg-blue-900/20 p-3 border border-blue-500/30 mb-3">
                                            <div className="flex items-center gap-2 text-blue-400 text-sm font-bold font-mono mb-1 uppercase">
                                                <BookmarkCheck size={16} />
                                                Seed Personalizado Ativo
                                            </div>
                                            <p className="text-xs text-blue-300/70 font-mono">
                                                O sistema usará seus dados salvos como ponto de reset.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-orbital-surface p-3 border border-orbital-border mb-3">
                                            <div className="flex items-center gap-2 text-orbital-subtext text-sm font-bold font-mono mb-1 uppercase">
                                                <Factory size={16} />
                                                Padrão de Fábrica
                                            </div>
                                            <p className="text-xs text-orbital-subtext/70 font-mono">
                                                Usando o arquivo limsData.ts original.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <OrbitalButton
                                            onClick={handleSetCurrentAsDefault}
                                            disabled={loading}
                                            variant="ghost"
                                            className="w-full justify-start text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 border border-transparent hover:border-indigo-500/30"
                                            icon={<BookmarkPlus size={16} />}
                                        >
                                            Definir Estado Atual como Padrão
                                        </OrbitalButton>

                                        {hasCustomSeed && (
                                            <OrbitalButton
                                                onClick={handleRestoreFactory}
                                                disabled={loading}
                                                variant="ghost"
                                                className="w-full justify-start text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 border border-transparent hover:border-orange-500/30"
                                                icon={<RotateCcw size={16} />}
                                            >
                                                Voltar ao Padrão de Fábrica
                                            </OrbitalButton>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </OrbitalCard>

                        {/* ZONA DE PERIGO */}
                        <OrbitalCard className="border-orbital-danger/30 bg-orbital-danger/5">
                            <div className="flex items-center gap-3 mb-4 text-orbital-danger">
                                <AlertOctagon size={24} />
                                <h3 className="text-lg font-bold font-display uppercase tracking-wide">Zona de Perigo</h3>
                            </div>

                            <div className="flex flex-col gap-3">
                                <OrbitalButton
                                    onClick={() => openResetModal('RELOAD')}
                                    variant="outline"
                                    className="w-full justify-start text-sm border-orbital-danger/30 text-orbital-danger hover:bg-orbital-danger/10"
                                    icon={<RotateCw size={16} />}
                                    disabled={loading}
                                >
                                    {hasCustomSeed ? 'Resetar para Meu Padrão' : 'Resetar para Padrão de Fábrica'}
                                </OrbitalButton>
                                <OrbitalButton
                                    onClick={() => openResetModal('EMPTY')}
                                    variant="danger"
                                    className="w-full justify-start text-sm"
                                    icon={<Trash2 size={16} />}
                                    disabled={loading}
                                >
                                    Apagar Tudo (Zero)
                                </OrbitalButton>
                            </div>
                        </OrbitalCard>
                    </div>
                </div>

                {/* Import Wizard Overlay */}
                <ImportWizard 
                    isOpen={wizardOpen} 
                    onClose={() => setWizardOpen(false)} 
                    mode={wizardMode} 
                />

                {/* Excel Setup Modal */}
                <ExcelSetupModal
                    isOpen={excelSetupOpen}
                    onClose={() => setExcelSetupOpen(false)}
                />

                {/* Secure Reset Modal */}
                <OrbitalModal
                    isOpen={resetModalOpen} 
                    onClose={() => setResetModalOpen(false)} 
                    title={resetTargetMode === 'EMPTY' ? "Apagar TUDO?" : "Recarregar Banco de Dados?"}
                >
                    <div className="space-y-6">
                        <div className="bg-orbital-danger/10 p-4 border border-orbital-danger/30 flex gap-3">
                            <div className="text-orbital-danger">
                                <AlertTriangle size={32} />
                            </div>
                            <div className="text-sm text-orbital-text">
                                <p className="font-bold mb-1 uppercase tracking-wide text-orbital-danger">Ação Destrutiva</p>
                                {resetTargetMode === 'EMPTY' ? (
                                    <p className="font-mono opacity-80">O sistema será esvaziado completamente. Todos os dados serão perdidos.</p>
                                ) : (
                                    <p className="font-mono opacity-80">
                                        Os dados atuais serão substituídos pelo ponto de restauração
                                        {hasCustomSeed ? ' (Seu Backup Personalizado)' : ' (Padrão de Fábrica)'}.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold font-display uppercase tracking-wide text-orbital-subtext">
                                Digite <span className="text-orbital-danger select-all">DELETAR</span> para confirmar:
                            </label>
                            <OrbitalInput
                                value={resetConfirmationText}
                                onChange={e => setResetConfirmationText(e.target.value)}
                                placeholder="DELETAR"
                                className="uppercase font-mono tracking-widest text-center border-orbital-danger text-orbital-danger focus:shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-orbital-border">
                            <OrbitalButton variant="ghost" onClick={() => setResetModalOpen(false)} disabled={loading}>
                                Cancelar
                            </OrbitalButton>
                            <OrbitalButton
                                variant="danger" 
                                onClick={handleExecuteReset}
                                disabled={resetConfirmationText.toUpperCase() !== 'DELETAR' || loading}
                                isLoading={loading}
                                className="px-6"
                            >
                                Confirmar Reset
                            </OrbitalButton>
                        </div>
                    </div>
                </OrbitalModal>
            </div>
        </PageContainer>
    );
};
