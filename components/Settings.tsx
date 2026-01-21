
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { InventoryService } from '../services/InventoryService';
import { ImportService } from '../services/ImportService';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { seedDatabase } from '../services/DatabaseSeeder'; 
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
import { ExportEngine } from '../utils/ExportEngine';

export const Settings: React.FC = () => {
    const { addToast } = useAlert();
    const { hasRole } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    
    const [googleUrl, setGoogleUrl] = useState('');
    const [isCloudConnected, setIsCloudConnected] = useState(false);

    const [enriching, setEnriching] = useState(false);
    const [enrichProgress, setEnrichProgress] = useState(0);
    const [enrichTotal, setEnrichTotal] = useState(0);
    
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardMode, setWizardMode] = useState<ImportMode>('MASTER');

    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const [resetTargetMode, setResetTargetMode] = useState<'EMPTY' | 'DEMO' | 'LIMS' | null>(null);

    const [tourEnabled, setTourEnabled] = useState(true);
    const [auditStats, setAuditStats] = useState<{ matches: number, mismatches: number, corrections: number } | null>(null);

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
            addToast('Seed Gerado', 'success', 'Substitua o arquivo "limsData.ts" no seu código fonte por este download.');
        } catch (e) {
            console.error(e);
            addToast('Erro', 'error', 'Falha ao gerar arquivo de seed.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleOverwriteSeeding = async () => {
        if (confirm("ATENÇÃO: Esta ação irá APAGAR todos os dados atuais e recarregar o banco de dados a partir do arquivo 'limsData.ts' (Dados Atuais). Continuar?")) {
            setLoading(true);
            try {
                await db.clearData(); 
                localStorage.removeItem('LC_SKIP_AUTO_SEED'); 
                await seedDatabase(true); 
                
                addToast('Sucesso', 'success', 'O seeding foi sobrescrito com os dados atuais.');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (e) {
                console.error("Erro ao sobrescrever seeding:", e);
                addToast('Erro Crítico', 'error', 'Falha ao recarregar dados. Verifique o console.');
            } finally {
                setLoading(false);
            }
        }
    };

    const openResetModal = (mode: 'EMPTY' | 'DEMO' | 'LIMS') => {
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
                addToast('Dados Carregados', 'success', 'A base de dados foi restaurada.');
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
        <PageContainer scrollable={true}>
            <div className="flex flex-col gap-8 pb-10 max-w-5xl mx-auto w-full">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white">Configurações e Dados</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-base">Gestão de banco de dados, nuvem e preferências.</p>
                </div>

                {/* Cards de Ação */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card padding="p-6">
                        <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white">
                            <span className="material-symbols-outlined text-2xl text-primary">upload_file</span>
                            <h3 className="text-lg font-bold">Importação</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => openWizard('MASTER')} variant="outline" className="w-full justify-start" icon="inventory_2">
                                Importar Inventário (Planilha)
                            </Button>
                            <Button onClick={() => openWizard('HISTORY')} variant="outline" className="w-full justify-start" icon="history">
                                Importar Histórico de Movimentações
                            </Button>
                        </div>
                    </Card>

                    <Card padding="p-6">
                        <div className="flex items-center gap-3 mb-4 text-text-main dark:text-white">
                            <span className="material-symbols-outlined text-2xl text-secondary">science</span>
                            <h3 className="text-lg font-bold">Enriquecimento de Dados</h3>
                        </div>
                        <p className="text-xs text-text-secondary dark:text-gray-400 mb-4">
                            Busca automática de dados químicos (Fórmula, Peso, Riscos) na API CAS para itens com CAS Number.
                        </p>
                        {enriching ? (
                             <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${(enrichProgress/enrichTotal)*100}%` }}></div>
                                <p className="text-xs text-center mt-1">{enrichProgress} / {enrichTotal}</p>
                             </div>
                        ) : (
                            <Button onClick={handleEnrichment} variant="primary" icon="auto_fix_high" className="w-full">
                                Enriquecer com CAS
                            </Button>
                        )}
                    </Card>
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
                                onClick={handleDownloadSeed}
                                disabled={loading}
                                variant="outline"
                                className="w-full justify-start mt-2 border-primary/20 text-primary hover:bg-primary/5"
                                icon="code"
                            >
                                Baixar como Seed File (limsData.ts)
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
                            
                            <Button 
                                onClick={handleOverwriteSeeding}
                                variant="primary" 
                                className="w-full justify-center text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                                icon="database"
                                disabled={loading}
                            >
                                Sobreescrever Seeding com Dados Atuais
                            </Button>

                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <Button 
                                    onClick={() => openResetModal('DEMO')}
                                    variant="white"
                                    className="w-full justify-center text-xs border-danger/20 text-danger-text hover:bg-danger-bg dark:hover:bg-danger/10"
                                    icon="restart_alt"
                                    disabled={loading}
                                >
                                    Restaurar Exemplo
                                </Button>
                                <Button 
                                    onClick={() => openResetModal('EMPTY')}
                                    variant="danger"
                                    className="w-full justify-center text-xs"
                                    icon="delete_forever"
                                    disabled={loading}
                                >
                                    Limpar Tudo
                                </Button>
                            </div>
                        </div>
                    </Card>
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
                    title={resetTargetMode === 'EMPTY' ? "Apagar TUDO e Iniciar do Zero?" : "Recarregar Banco de Dados?"} 
                    className="max-w-md"
                >
                    <div className="p-6 pt-0">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 mb-6 flex gap-3">
                            <span className="material-symbols-outlined text-danger text-3xl">warning</span>
                            <div className="text-sm text-danger-text dark:text-red-200">
                                <p className="font-bold mb-1">Ação Irreversível</p>
                                <p>Todos os dados locais atuais serão apagados permanentemente.</p>
                                {resetTargetMode === 'EMPTY' && (
                                    <p className="mt-2 font-bold underline">O sistema iniciará totalmente vazio.</p>
                                )}
                                {(resetTargetMode === 'DEMO' || resetTargetMode === 'LIMS') && (
                                    <p className="mt-2 font-bold underline">Os dados padrão serão recarregados.</p>
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
