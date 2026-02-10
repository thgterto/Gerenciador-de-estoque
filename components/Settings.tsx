
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { InventoryService } from '../services/InventoryService';
import { ImportService } from '../services/ImportService';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { seedDatabase } from '../services/DatabaseSeeder'; 
import { GOOGLE_CONFIG } from '../config/apiConfig';
import { useAlert } from '../context/AlertContext';
import { ImportWizard } from './ImportWizard';
import { ImportMode } from '../utils/ImportEngine';
import { Card } from './ui/Card'; 
import { Button } from './ui/Button'; 
import { Modal } from './ui/Modal'; 
import { PageContainer } from './ui/PageContainer'; 
import { Input } from './ui/Input';
import { ExportEngine } from '../utils/ExportEngine';

export const Settings: React.FC = () => {
    const { addToast } = useAlert();
    const [loading, setLoading] = useState(false);
    
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
                <div className="flex flex-col gap-2 border-b border-border-light dark:border-border-dark pb-6">
                    <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white">Configurações e Sistema</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-base max-w-2xl">
                        Gerencie importações, integrações com nuvem, backups e redefinições do sistema.
                    </p>
                </div>

                {/* Grid Layout Responsivo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    {/* Coluna 1: Operações de Dados */}
                    <div className="flex flex-col gap-6">
                        <Card padding="p-6">
                            <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-xl">upload_file</span>
                                </div>
                                <h3 className="text-lg font-bold">Importação e Carga</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button onClick={() => openWizard('MASTER')} variant="outline" className="w-full justify-start text-sm" icon="inventory_2">
                                    Importar Inventário (Planilha)
                                </Button>
                                <Button onClick={() => openWizard('HISTORY')} variant="outline" className="w-full justify-start text-sm" icon="history">
                                    Importar Histórico
                                </Button>
                            </div>
                        </Card>

                        <Card padding="p-6">
                            <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white">
                                <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                                    <span className="material-symbols-outlined text-xl">science</span>
                                </div>
                                <h3 className="text-lg font-bold">Enriquecimento de Dados</h3>
                            </div>
                            <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
                                Busca automática de dados químicos (Fórmula, Peso, Riscos) na API CAS para itens com CAS Number.
                            </p>
                            {enriching ? (
                                <div className="w-full space-y-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                                        <div className="bg-secondary h-2.5 rounded-full transition-all duration-300" style={{ width: `${(enrichProgress/enrichTotal)*100}%` }}></div>
                                    </div>
                                    <p className="text-xs text-center text-text-secondary">{enrichProgress} de {enrichTotal} itens processados</p>
                                </div>
                            ) : (
                                <Button onClick={handleEnrichment} variant="primary" icon="auto_fix_high" className="w-full text-sm">
                                    Enriquecer Itens com CAS
                                </Button>
                            )}
                        </Card>

                        <Card padding="p-6">
                            <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white relative z-10">
                                <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-300">
                                    <span className="material-symbols-outlined text-xl">fact_check</span>
                                </div>
                                <h3 className="text-lg font-bold">Auditoria de Integridade</h3>
                            </div>
                            <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
                                Verifica consistência entre saldo visual e histórico (Ledger).
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button onClick={() => handleRunAudit(false)} variant="secondary" icon="search_check" disabled={loading} className="flex-1 text-sm">
                                    Verificar
                                </Button>
                                {auditStats && auditStats.mismatches > 0 && (
                                    <Button onClick={() => handleRunAudit(true)} variant="warning" icon="build" disabled={loading} className="flex-1 text-sm">
                                        Corrigir ({auditStats.mismatches})
                                    </Button>
                                )}
                            </div>

                            {auditStats && (
                                <div className={`mt-4 p-3 rounded-lg border text-sm ${auditStats.mismatches > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                                    <p className="font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">{auditStats.mismatches > 0 ? 'warning' : 'check_circle'}</span>
                                        Resultado:
                                    </p>
                                    <ul className="list-disc pl-6 mt-1 text-xs space-y-1 opacity-90">
                                        <li>Sincronizados: {auditStats.matches}</li>
                                        <li>Divergências: {auditStats.mismatches}</li>
                                        {auditStats.corrections > 0 && <li>Corrigidos: {auditStats.corrections}</li>}
                                    </ul>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Coluna 2: Integração e Sistema */}
                    <div className="flex flex-col gap-6">
                        {/* Google Sheets */}
                        <Card padding="p-6" className="border-l-4 border-l-[#0F9D58] relative overflow-hidden">
                             <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white relative z-10">
                                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-[#0F9D58] dark:text-green-300">
                                    <span className="material-symbols-outlined text-xl">table_view</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold">Google Sheets</h3>
                                    <p className="text-xs text-text-secondary dark:text-gray-400">Integração com Apps Script</p>
                                </div>
                                {isCloudConnected ? (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">wifi</span> Online
                                    </span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">wifi_off</span> Offline
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <Input
                                    label="URL do Web App"
                                    value={googleUrl}
                                    onChange={e => setGoogleUrl(e.target.value)}
                                    placeholder="https://script.google.com/..."
                                    className="text-sm"
                                />
                                <div className="flex gap-3">
                                    <Button onClick={handleSaveGoogleConfig} variant="primary" disabled={loading} icon="save" className="flex-1 text-sm">
                                        Conectar
                                    </Button>
                                    <Button onClick={handleSync} variant="outline" disabled={!isCloudConnected || loading} icon="sync" className="flex-1 text-sm">
                                        Sincronizar
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Backup e Seed */}
                        <Card padding="p-6">
                            <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                                    <span className="material-symbols-outlined text-xl">save</span>
                                </div>
                                <h3 className="text-lg font-bold">Backup e Padrões</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Exportação</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            onClick={() => handleExportExcel(false)}
                                            disabled={loading}
                                            variant="outline"
                                            className="w-full text-sm"
                                            icon="download"
                                        >
                                            Backup (.xlsx)
                                        </Button>
                                        <Button
                                            onClick={handleDownloadSeed}
                                            disabled={loading}
                                            variant="outline"
                                            className="w-full text-sm"
                                            icon="code"
                                        >
                                            Baixar Seed
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Ponto de Restauração</p>

                                    {hasCustomSeed ? (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mb-3">
                                            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-sm font-bold mb-1">
                                                <span className="material-symbols-outlined text-base">bookmark_added</span>
                                                Seed Personalizado Ativo
                                            </div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                                O sistema usará seus dados salvos como ponto de reset.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mb-3">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm font-bold mb-1">
                                                <span className="material-symbols-outlined text-base">factory</span>
                                                Padrão de Fábrica
                                            </div>
                                            <p className="text-xs text-text-secondary">
                                                Usando o arquivo limsData.ts original.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <Button
                                            onClick={handleSetCurrentAsDefault}
                                            disabled={loading}
                                            variant="white"
                                            className="w-full justify-start text-sm border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                            icon="bookmark_add"
                                        >
                                            Definir Estado Atual como Padrão
                                        </Button>

                                        {hasCustomSeed && (
                                            <Button
                                                onClick={handleRestoreFactory}
                                                disabled={loading}
                                                variant="white"
                                                className="w-full justify-start text-sm border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                icon="restore"
                                            >
                                                Voltar ao Padrão de Fábrica
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* ZONA DE PERIGO */}
                        <Card padding="p-6" className="border-danger/30 dark:border-danger/20 bg-danger-bg/5 dark:bg-danger/5">
                            <div className="flex items-center gap-3 mb-4 text-danger">
                                <span className="material-symbols-outlined text-xl">dangerous</span>
                                <h3 className="text-lg font-bold">Zona de Perigo</h3>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button 
                                    onClick={() => openResetModal('RELOAD')}
                                    variant="white"
                                    className="w-full justify-start text-sm border-danger/20 text-danger-text hover:bg-danger-bg dark:hover:bg-danger/10"
                                    icon="restart_alt"
                                    disabled={loading}
                                >
                                    {hasCustomSeed ? 'Resetar para Meu Padrão' : 'Resetar para Padrão de Fábrica'}
                                </Button>
                                <Button 
                                    onClick={() => openResetModal('EMPTY')}
                                    variant="danger"
                                    className="w-full justify-start text-sm"
                                    icon="delete_forever"
                                    disabled={loading}
                                >
                                    Apagar Tudo (Zero)
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Import Wizard Overlay */}
                <ImportWizard 
                    isOpen={wizardOpen} 
                    onClose={() => setWizardOpen(false)} 
                    mode={wizardMode} 
                />

                {/* Secure Reset Modal */}
                <Modal 
                    isOpen={resetModalOpen} 
                    onClose={() => setResetModalOpen(false)} 
                    title={resetTargetMode === 'EMPTY' ? "Apagar TUDO?" : "Recarregar Banco de Dados?"}
                    className="max-w-md"
                >
                    <div className="p-6 pt-0">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 mb-6 flex gap-3">
                            <span className="material-symbols-outlined text-danger text-3xl">warning</span>
                            <div className="text-sm text-danger-text dark:text-red-200">
                                <p className="font-bold mb-1">Ação Destrutiva</p>
                                {resetTargetMode === 'EMPTY' ? (
                                    <p>O sistema será esvaziado completamente. Todos os dados serão perdidos.</p>
                                ) : (
                                    <p>
                                        Os dados atuais serão substituídos pelo ponto de restauração
                                        {hasCustomSeed ? ' (Seu Backup Personalizado)' : ' (Padrão de Fábrica)'}.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-text-main dark:text-white">
                                Digite <span className="font-bold font-mono text-danger">DELETAR</span> para confirmar:
                            </label>
                            <Input 
                                value={resetConfirmationText}
                                onChange={e => setResetConfirmationText(e.target.value)}
                                placeholder="DELETAR"
                                className="uppercase font-mono tracking-widest text-center border-red-300 focus:border-red-500 focus:ring-red-200"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button variant="ghost" onClick={() => setResetModalOpen(false)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={handleExecuteReset}
                                disabled={resetConfirmationText.toUpperCase() !== 'DELETAR' || loading}
                                isLoading={loading}
                                className="px-6"
                            >
                                Confirmar Reset
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </PageContainer>
    );
};
