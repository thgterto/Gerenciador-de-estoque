import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { InventoryService } from '../services/InventoryService';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { GOOGLE_CONFIG } from '../config/apiConfig';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ImportWizard } from './ImportWizard';
import { ImportMode } from '../utils/ImportEngine';
import { Card } from './ui/Card'; 
import { Button } from './ui/Button'; 
import { Modal } from './ui/Modal'; 
import { PageContainer } from './ui/PageContainer'; 
import { Input } from './ui/Input';

export const Settings: React.FC = () => {
    const { addToast } = useAlert();
    const { hasRole } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    
    // Cloud Settings (Google Sheets)
    const [googleUrl, setGoogleUrl] = useState('');
    const [isCloudConnected, setIsCloudConnected] = useState(false);

    // Enrichment State
    const [enriching, setEnriching] = useState(false);
    const [enrichProgress, setEnrichProgress] = useState(0);
    const [enrichTotal, setEnrichTotal] = useState(0);
    
    // Wizard State
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardMode, setWizardMode] = useState<ImportMode>('MASTER');

    // Secure Reset State
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const [resetTargetMode, setResetTargetMode] = useState<'EMPTY' | 'DEMO' | null>(null);

    // Tour State
    const [tourEnabled, setTourEnabled] = useState(true);

    // Audit State
    const [auditStats, setAuditStats] = useState<{ matches: number, mismatches: number, corrections: number } | null>(null);

    // File Input Ref for JSON Upload
    const jsonInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const isEnabled = localStorage.getItem('LC_TUTORIAL_ENABLED') !== 'false';
        setTourEnabled(isEnabled);
        
        const url = GOOGLE_CONFIG.getWebUrl();
        setGoogleUrl(url);
        if (url) {
            checkConnection();
        }
    }, []);

    const checkConnection = async () => {
        const connected = await GoogleSheetsService.testConnection();
        setIsCloudConnected(connected);
    };

    const toggleTour = () => {
        const newValue = !tourEnabled;
        setTourEnabled(newValue);
        localStorage.setItem('LC_TUTORIAL_ENABLED', String(newValue));
        addToast(
            newValue ? 'Onboarding Ativado' : 'Onboarding Desativado',
            newValue ? 'success' : 'info',
            newValue ? 'O guia será exibido para novos usuários.' : 'O guia não será exibido automaticamente.'
        );
    };

    const resetTourHistory = () => {
        localStorage.removeItem('LC_TUTORIAL_SEEN');
        addToast('Histórico Reiniciado', 'success', 'O tour será exibido na próxima atualização da página.');
    };

    // --- Actions ---

    const handleSaveGoogleConfig = async () => {
        let cleanUrl = googleUrl.trim();
        
        if (!cleanUrl) {
            addToast('URL Inválida', 'warning', 'Preencha a URL do Google Web App.');
            return;
        }

        // Auto-fix common URL mistakes
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
        
        // Warning Dialog logic
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
    
    const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const jsonContent = JSON.parse(evt.target?.result as string);
                
                if (confirm("ATENÇÃO: Esta ação substituirá todo o banco de dados atual pelos dados do arquivo JSON selecionado. Deseja continuar?")) {
                    setLoading(true);
                    await InventoryService.replaceDatabaseWithData(jsonContent);
                    addToast('Banco de Dados Restaurado', 'success', 'Os dados foram carregados com sucesso.');
                    setTimeout(() => window.location.reload(), 1500);
                }
            } catch (err) {
                console.error(err);
                addToast('Erro no Arquivo', 'error', 'O arquivo selecionado não é um JSON válido ou está corrompido.');
            } finally {
                setLoading(false);
                if (jsonInputRef.current) jsonInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const openResetModal = (mode: 'EMPTY' | 'DEMO') => {
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
            const keysToKeep = ['LC_THEME', 'LC_AUTH_USER', 'LC_TUTORIAL_ENABLED', 'LC_GAS_WEBAPP_URL'];
            Object.keys(localStorage).forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });

            if (resetTargetMode === 'EMPTY') {
                localStorage.setItem('LC_SKIP_AUTO_SEED', 'true');
                addToast('Sistema Limpo', 'success', 'O banco de dados foi esvaziado com sucesso.');
            } else {
                localStorage.removeItem('LC_SKIP_AUTO_SEED');
                addToast('Restaurando Demo', 'success', 'Os dados de exemplo serão recarregados.');
            }

            setTimeout(() => {
                window.location.reload(); 
            }, 1000);

        } catch (e) {
            console.error("Erro ao resetar:", e);
            addToast('Erro Crítico', 'error', 'Não foi possível limpar o banco. Tente recarregar a página.');
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
                const result = await InventoryService.enrichInventory((current, total) => {
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
        <PageContainer scrollable={true}>
            <div className="flex flex-col gap-8 pb-10 max-w-5xl mx-auto w-full">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white">Configurações e Dados</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-base">Gestão de banco de dados, nuvem e preferências.</p>
                </div>

                {/* --- SEÇÃO: GOOGLE SHEETS INTEGRATION --- */}
                <Card padding="p-6" className="border-l-4 border-l-[#0F9D58]">
                     <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white relative z-10">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-[#0F9D58] dark:text-green-300 border border-green-100 dark:border-green-800">
                            <span className="material-symbols-outlined text-2xl">table_view</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold">Google Sheets Backend</h3>
                            <p className="text-xs text-text-secondary dark:text-gray-400">
                                Conecte ao Google Apps Script para usar uma Planilha como banco de dados.
                            </p>
                        </div>
                        {isCloudConnected ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check_circle</span> Online
                            </span>
                        ) : (
                            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">Offline</span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <Input 
                            label="URL do Web App (Google Apps Script)" 
                            value={googleUrl}
                            onChange={e => setGoogleUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            helpText="Certifique-se de implantar como 'Web App' e definir o acesso como 'Qualquer pessoa'."
                        />
                        <div className="flex gap-3">
                            <Button onClick={handleSaveGoogleConfig} variant="primary" disabled={loading} icon="save">
                                {loading ? 'Testando...' : 'Salvar e Conectar'}
                            </Button>
                            <Button onClick={handleSync} variant="outline" disabled={!isCloudConnected || loading} icon="sync">
                                Sincronizar Agora
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* AUDITORIA DE LEDGER */}
                <Card padding="p-6">
                    <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white relative z-10">
                         <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                            <span className="material-symbols-outlined text-2xl">fact_check</span>
                        </div>
                        <h3 className="text-lg font-bold">Auditoria de Integridade (Ledger)</h3>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
                        Verifica se o saldo visual (Snapshot V1) corresponde à soma matemática dos lotes e movimentações (Ledger V2).
                        Utilize isso se suspeitar de inconsistência após importações.
                    </p>
                    
                    <div className="flex items-center gap-4">
                         <Button onClick={() => handleRunAudit(false)} variant="secondary" icon="search_check" disabled={loading}>
                             Verificar Integridade
                         </Button>
                         {auditStats && auditStats.mismatches > 0 && (
                             <Button onClick={() => handleRunAudit(true)} variant="warning" icon="build" disabled={loading}>
                                 Corrigir {auditStats.mismatches} Divergências
                             </Button>
                         )}
                    </div>
                    
                    {auditStats && (
                         <div className={`mt-4 p-3 rounded-lg border text-sm ${auditStats.mismatches > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                             <p className="font-bold flex items-center gap-2">
                                 <span className="material-symbols-outlined">{auditStats.mismatches > 0 ? 'warning' : 'check_circle'}</span>
                                 Resultado da Auditoria:
                             </p>
                             <ul className="list-disc pl-8 mt-1 space-y-1">
                                 <li>Itens Sincronizados: {auditStats.matches}</li>
                                 <li>Divergências Encontradas: {auditStats.mismatches}</li>
                                 {auditStats.corrections > 0 && <li>Correções Aplicadas: {auditStats.corrections}</li>}
                             </ul>
                         </div>
                    )}
                </Card>

                {/* CAS ENRICHMENT SECTION */}
                <Card padding="p-6" className="relative overflow-hidden bg-info-bg/30 dark:bg-info/10 border-info/20">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                         <span className="material-symbols-outlined text-9xl text-info dark:text-white">science</span>
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-info-text dark:text-blue-400 relative z-10">
                        <div className="p-2 bg-info-bg dark:bg-blue-900/30 rounded-lg border border-info/20">
                            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                        </div>
                        <h3 className="text-lg font-bold text-text-main dark:text-white">Inteligência Química (CAS.org)</h3>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-gray-300 mb-6 relative z-10 max-w-3xl">
                        Conecte-se à base de dados do CAS Common Chemistry para preencher automaticamente as 
                        classificações de risco (GHS) e padronizar nomes de reagentes usando o número CAS.
                    </p>

                    <div className="relative z-10">
                         <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Button 
                                onClick={handleEnrichment}
                                disabled={enriching || loading}
                                variant="primary"
                                className="bg-info hover:bg-blue-600 text-white border-none shadow-md shadow-blue-500/20 w-full sm:w-auto"
                                icon={enriching ? 'hourglass_top' : 'cloud_sync'}
                            >
                                {enriching ? 'Processando...' : 'Buscar Informações Faltantes'}
                            </Button>
                            {enriching && (
                                <div className="flex flex-col gap-1 flex-1 w-full max-w-xs">
                                    <div className="flex justify-between text-xs font-bold text-info-text dark:text-blue-300">
                                        <span>Consultando API...</span>
                                        <span>{enrichProgress} / {enrichTotal}</span>
                                    </div>
                                    <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-info h-2 rounded-full transition-all duration-300" 
                                            style={{width: `${enrichTotal > 0 ? (enrichProgress / enrichTotal) * 100 : 0}%`}}
                                        ></div>
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>
                </Card>

                {/* MIGRATION SECTION - EXCEL IMPORTS */}
                <Card padding="p-6" className="relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 text-primary relative z-10">
                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="material-symbols-outlined text-2xl">import_export</span>
                        </div>
                        <h3 className="text-lg font-bold text-text-main dark:text-white">Importação e Migração de Excel</h3>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-gray-400 mb-6 relative z-10 max-w-3xl">
                        Ferramentas para carregar dados externos. Utilize os botões abaixo para importar planilhas (.xlsx, .csv) 
                        com suporte automático à detecção de tabelas e mapeamento inteligente.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {/* Card 1: Master Data */}
                        <Card variant="interactive" padding="p-5" className="bg-surface-light dark:bg-surface-dark hover:bg-background-light dark:hover:bg-background-dark border-none ring-1 ring-border-light dark:ring-border-dark hover:ring-primary/50" onClick={() => openWizard('MASTER')}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary text-2xl bg-primary/5 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">inventory_2</span>
                                <h4 className="font-bold text-text-main dark:text-white">1. Importar Inventário (Mestre)</h4>
                            </div>
                            <p className="text-xs text-text-secondary dark:text-gray-400 mb-4 flex-1">
                                Carregue cadastro de produtos, saldos iniciais e dados de Lote/Validade. Suporta detecção automática de cabeçalhos e mesclagem inteligente.
                            </p>
                            <div className="w-full py-2.5 bg-primary text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-md shadow-primary/20 pointer-events-none">
                                <span className="material-symbols-outlined text-sm">upload_file</span>
                                Iniciar Importação
                            </div>
                        </Card>

                        {/* Card 2: History Data */}
                        <Card variant="interactive" padding="p-5" className="bg-surface-light dark:bg-surface-dark hover:bg-background-light dark:hover:bg-background-dark border-none ring-1 ring-border-light dark:ring-border-dark hover:ring-secondary/50" onClick={() => openWizard('HISTORY')}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-secondary text-2xl bg-secondary/5 p-2 rounded-full group-hover:bg-secondary group-hover:text-white transition-colors">history</span>
                                <h4 className="font-bold text-text-main dark:text-white">2. Importar Histórico (Movimentações)</h4>
                            </div>
                            <p className="text-xs text-text-secondary dark:text-gray-400 mb-4 flex-1">
                                Carregue logs de entradas e saídas passadas. Útil para auditoria e reconstrução de saldo via Ledger V2.
                            </p>
                            <div className="w-full py-2.5 bg-secondary text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-md shadow-secondary/20 pointer-events-none">
                                <span className="material-symbols-outlined text-sm">history_edu</span>
                                Carregar Histórico
                            </div>
                        </Card>

                        {/* Card 3: JSON Restore */}
                        <Card variant="interactive" padding="p-5" className="bg-surface-light dark:bg-surface-dark hover:bg-background-light dark:hover:bg-background-dark border-none ring-1 ring-border-light dark:ring-border-dark hover:ring-slate-500" onClick={() => jsonInputRef.current?.click()}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-slate-500 text-2xl bg-slate-100 dark:bg-slate-800 p-2 rounded-full group-hover:bg-slate-500 group-hover:text-white transition-colors">restore</span>
                                <h4 className="font-bold text-text-main dark:text-white">3. Restaurar Backup JSON</h4>
                            </div>
                            <p className="text-xs text-text-secondary dark:text-gray-400 mb-4 flex-1">
                                Restauração completa de banco de dados nativo do LabControl (Full Dump).
                            </p>
                             <div className="w-full py-2.5 bg-slate-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-md shadow-slate-500/20 pointer-events-none">
                                <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
                                Carregar JSON
                            </div>
                            <input 
                                type="file" 
                                ref={jsonInputRef} 
                                onChange={handleJsonUpload} 
                                className="hidden" 
                                accept=".json"
                            />
                        </Card>
                    </div>
                </Card>

                {/* BACKUP & SYSTEM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card padding="p-6">
                        <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white">
                            <span className="material-symbols-outlined text-2xl text-text-secondary dark:text-slate-400">cloud_download</span>
                            <h3 className="text-lg font-bold">Backup e Modelos</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button 
                                onClick={() => handleExportExcel(false)}
                                disabled={loading}
                                variant="white"
                                className="w-full justify-start dark:bg-transparent dark:text-white dark:border-gray-600 dark:hover:bg-slate-800"
                                icon="download"
                            >
                                {loading ? 'Gerando...' : 'Backup Completo (.xlsx)'}
                            </Button>
                            
                            <Button 
                                onClick={() => handleExportExcel(true)}
                                disabled={loading}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-center mt-1"
                            >
                                Baixar Modelo de Importação
                            </Button>
                        </div>
                    </Card>

                    <Card padding="p-6" className="border-danger/30 dark:border-danger/20 bg-danger-bg/5 dark:bg-danger/5">
                        <div className="flex items-center gap-3 mb-4 text-danger">
                            <span className="material-symbols-outlined text-2xl">dangerous</span>
                            <h3 className="text-lg font-bold">Zona de Perigo</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            <p className="text-xs text-text-secondary dark:text-gray-400 mb-1">
                                Ações destrutivas ou de correção avançada.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <Button 
                                    onClick={() => openResetModal('DEMO')}
                                    variant="white"
                                    className="w-full justify-center text-xs border-danger/20 text-danger-text hover:bg-danger-bg dark:hover:bg-danger/10"
                                    icon="restart_alt"
                                    disabled={loading}
                                >
                                    Restaurar Demo
                                </Button>
                                <Button 
                                    onClick={() => openResetModal('EMPTY')}
                                    variant="danger"
                                    className="w-full justify-center text-xs"
                                    icon="delete_forever"
                                    disabled={loading}
                                >
                                    Limpar Tudo (Zero)
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
                
                {/* Componentes de Overlay */}
                <ImportWizard 
                    isOpen={wizardOpen} 
                    onClose={() => setWizardOpen(false)} 
                    mode={wizardMode} 
                />

                {/* Secure Reset Modal */}
                <Modal 
                    isOpen={resetModalOpen} 
                    onClose={() => setResetModalOpen(false)} 
                    title={resetTargetMode === 'EMPTY' ? "Apagar TUDO e Iniciar do Zero?" : "Restaurar Dados de Exemplo?"} 
                    className="max-w-md"
                >
                    <div className="p-6 pt-0">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 mb-6 flex gap-3">
                            <span className="material-symbols-outlined text-danger text-3xl">warning</span>
                            <div className="text-sm text-danger-text dark:text-red-200">
                                <p className="font-bold mb-1">Ação Irreversível</p>
                                <p>Todos os dados locais, incluindo histórico e configurações, serão apagados permanentemente.</p>
                                {resetTargetMode === 'EMPTY' && (
                                    <p className="mt-2 font-bold underline">O sistema iniciará totalmente vazio.</p>
                                )}
                                {resetTargetMode === 'DEMO' && (
                                    <p className="mt-2 font-bold underline">Os dados fictícios (LIMS) serão recarregados.</p>
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