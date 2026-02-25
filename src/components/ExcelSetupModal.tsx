import React, { useState } from 'react';
import { OrbitalModal } from './ui/orbital/OrbitalModal';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { ExcelScriptGenerator } from '../utils/ExcelScriptGenerator';
import { ExcelIntegrationService } from '../services/ExcelIntegrationService';
import { EXCEL_CONFIG } from '../config/apiConfig';
import { useAlert } from '../context/AlertContext';
import { Copy, Check, Table2, Play, ExternalLink, Link2, Wifi, Terminal } from 'lucide-react';

interface ExcelSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const STEPS = [
    { id: 1, title: 'Preparar Planilha' },
    { id: 2, title: 'Configurar Webhook' },
    { id: 3, title: 'Conectar' }
];

export const ExcelSetupModal: React.FC<ExcelSetupModalProps> = ({ isOpen, onClose }) => {
    const { addToast } = useAlert();
    const [step, setStep] = useState(1);
    const [webhookUrl, setWebhookUrl] = useState(EXCEL_CONFIG.getWebhookUrl());
    const [testing, setTesting] = useState(false);
    const [copied, setCopied] = useState(false);

    const scriptCode = ExcelScriptGenerator.generateSetupScript();

    const handleCopyScript = () => {
        navigator.clipboard.writeText(scriptCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        addToast('Copiado', 'success', 'Código do script copiado para a área de transferência.');
    };

    const handleTestConnection = async () => {
        if (!webhookUrl) {
            addToast('URL Ausente', 'warning', 'Cole a URL do Webhook primeiro.');
            return;
        }

        // Save temporarily to test
        const originalUrl = EXCEL_CONFIG.getWebhookUrl();
        EXCEL_CONFIG.setWebhookUrl(webhookUrl);

        setTesting(true);
        try {
            const success = await ExcelIntegrationService.testConnection();
            if (success) {
                addToast('Conectado!', 'success', 'Comunicação com Power Automate estabelecida.');
            } else {
                addToast('Falha na Conexão', 'error', 'O servidor respondeu, mas não confirmou o sucesso.');
            }
        } catch (e) {
            addToast('Erro de Rede', 'error', 'Não foi possível contatar o Webhook.');
            // Revert if failed? No, maybe user wants to save anyway.
        } finally {
            setTesting(false);
        }
    };

    const handleSave = () => {
        if (webhookUrl) {
            EXCEL_CONFIG.setWebhookUrl(webhookUrl);
            addToast('Configuração Salva', 'success', 'Integração Excel ativada.');
            onClose();
        } else {
            addToast('Atenção', 'warning', 'URL do Webhook é obrigatória.');
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="bg-orbital-surface p-4 rounded border border-orbital-border text-sm text-orbital-subtext">
                            <p className="mb-2 font-bold text-orbital-text flex items-center gap-2">
                                <Table2 size={16} /> 1. Crie uma Planilha no Excel Online
                            </p>
                            <p className="mb-4">
                                Você precisa de uma planilha vazia para armazenar os dados. Use este script para criar as tabelas automaticamente.
                            </p>
                            <div className="bg-black/30 p-3 rounded font-mono text-xs text-green-400 overflow-y-auto max-h-48 border border-white/5 relative group">
                                <pre>{scriptCode}</pre>
                                <button
                                    onClick={handleCopyScript}
                                    className="absolute top-2 right-2 p-2 bg-orbital-bg border border-orbital-border rounded hover:bg-orbital-accent/20 transition-colors"
                                >
                                    {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-orbital-subtext/70 px-2">
                            <span>Vá em: Automatizar &gt; Novo Script &gt; Colar &gt; Executar</span>
                            <a href="https://excel.office.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-orbital-accent">
                                Abrir Excel <ExternalLink size={10} />
                            </a>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <div className="bg-orbital-surface p-4 rounded border border-orbital-border text-sm text-orbital-subtext">
                            <p className="mb-2 font-bold text-orbital-text flex items-center gap-2">
                                <Terminal size={16} /> 2. Crie um Fluxo no Power Automate
                            </p>
                            <ol className="list-decimal pl-5 space-y-2 marker:text-orbital-accent">
                                <li>Crie um "Fluxo da Nuvem Instantâneo".</li>
                                <li>Gatilho: <strong>Quando uma solicitação HTTP é recebida</strong>.</li>
                                <li>Ação: <strong>Executar script</strong> (Excel Online Business).</li>
                                <li>Salve o fluxo para gerar a <strong>URL do HTTP POST</strong>.</li>
                            </ol>
                        </div>
                        <div className="bg-blue-900/10 p-3 rounded border border-blue-500/20 text-xs text-blue-300">
                            <strong>Dica:</strong> Use "Quem pode acionar" como "Qualquer pessoa" (ou configure autenticação avançada se souber).
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-orbital-text flex items-center gap-2">
                                <Link2 size={16} /> Cole a URL do Webhook
                            </label>
                            <OrbitalInput
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder="https://prod-XX.westus.logic.azure.com:443/workflows/..."
                                fullWidth
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <OrbitalButton
                                onClick={handleTestConnection}
                                isLoading={testing}
                                variant="outline"
                                icon={<Wifi size={16} />}
                                className="w-full"
                            >
                                Testar Conexão
                            </OrbitalButton>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <OrbitalModal isOpen={isOpen} onClose={onClose} title="Configuração de Automação Excel">
            <div className="w-full max-w-lg mx-auto">
                {/* Stepper */}
                <div className="flex items-center justify-between mb-8 px-2">
                    {STEPS.map((s, idx) => (
                        <div key={s.id} className={`flex items-center gap-2 ${step === s.id ? 'text-orbital-accent' : (step > s.id ? 'text-green-400' : 'text-orbital-subtext/40')}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${step === s.id ? 'border-orbital-accent bg-orbital-accent/10' : (step > s.id ? 'border-green-400 bg-green-400/10' : 'border-current')}`}>
                                {step > s.id ? <Check size={12} /> : s.id}
                            </div>
                            <span className="text-xs uppercase font-bold tracking-wider hidden sm:block">{s.title}</span>
                            {idx < STEPS.length - 1 && <div className="w-8 h-[1px] bg-white/10 mx-2" />}
                        </div>
                    ))}
                </div>

                {renderStepContent()}

                <div className="flex justify-between mt-8 pt-4 border-t border-orbital-border">
                    <OrbitalButton
                        variant="ghost"
                        onClick={step === 1 ? onClose : () => setStep(step - 1)}
                    >
                        {step === 1 ? 'Cancelar' : 'Voltar'}
                    </OrbitalButton>

                    {step < 3 ? (
                        <OrbitalButton variant="primary" onClick={() => setStep(step + 1)} icon={<Play size={16} />}>
                            Próximo
                        </OrbitalButton>
                    ) : (
                        <OrbitalButton variant="primary" onClick={handleSave} disabled={!webhookUrl}>
                            Salvar Integração
                        </OrbitalButton>
                    )}
                </div>
            </div>
        </OrbitalModal>
    );
};
