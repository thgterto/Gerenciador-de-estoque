import React, { useState } from 'react';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { useAlert } from '../context/AlertContext';
import { Send, User, Mail } from 'lucide-react';

export const ExcelIntegrationForm: React.FC = () => {
    const { addToast } = useAlert();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim()) {
            addToast('Campos Obrigatórios', 'warning', 'Preencha Nome e Email.');
            return;
        }

        setLoading(true);

        try {
            // @ts-expect-error - electronAPI is extended in window
            const result = await window.electronAPI.request('send_to_excel', { name, email });

            if (result.success) {
                addToast('Sucesso', 'success', 'Dados enviados para o Excel via Power Automate.');
                setName('');
                setEmail('');
            } else {
                addToast('Erro no Envio', 'error', result.error || 'Falha desconhecida.');
            }
        } catch (error: any) {
            console.error('Submit Error:', error);
            addToast('Erro de Conexão', 'error', 'Falha ao comunicar com o backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <OrbitalInput
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                fullWidth
                leftIcon={<User size={16} />}
                disabled={loading}
            />

            <OrbitalInput
                label="Endereço de Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: joao@empresa.com"
                fullWidth
                leftIcon={<Mail size={16} />}
                disabled={loading}
            />

            <div className="pt-2">
                <OrbitalButton
                    type="submit"
                    isLoading={loading}
                    icon={<Send size={16} />}
                    fullWidth
                    variant="primary"
                >
                    Enviar para Excel
                </OrbitalButton>
            </div>

            <p className="text-xs text-orbital-subtext font-mono mt-2 text-center opacity-70">
                Os dados serão processados via Power Automate e inseridos na planilha online.
            </p>
        </form>
    );
};
