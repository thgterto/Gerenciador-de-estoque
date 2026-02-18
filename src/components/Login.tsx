
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const Login: React.FC = () => {
    const { login } = useAuth();
    const { addToast } = useAlert();
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!username || !password) return;

        setIsLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                addToast('Bem-vindo', 'success', 'Login realizado com sucesso.');
            } else {
                addToast('Falha no Login', 'error', 'Usuário ou senha incorretos.');
            }
        } catch (error) {
            addToast('Erro', 'error', 'Ocorreu um erro ao tentar logar.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4 overflow-y-auto">
            <Card padding="p-0" className="w-full max-w-md overflow-hidden animate-scale-in">
                <div className="p-8 bg-background-light dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark text-center">
                    <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-full mb-4 text-primary border border-primary/20">
                        <span className="material-symbols-outlined text-4xl">science</span>
                    </div>
                    <h1 className="text-2xl font-black text-text-main dark:text-white tracking-tight">LabControl</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">Estoque UMV</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-surface-light dark:bg-surface-dark">
                    <Input 
                        label="Usuário"
                        icon="person"
                        placeholder="Digite seu usuário"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoFocus
                    />

                    <Input 
                        label="Senha"
                        icon="lock"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />

                    <Button 
                        type="submit" 
                        isLoading={isLoading}
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                        icon="login"
                    >
                        {isLoading ? 'Entrando...' : 'Acessar Sistema'}
                    </Button>
                    
                    <div className="text-center text-xs text-text-secondary dark:text-gray-500 mt-4">
                        <p>Dica: Tente <strong>admin/admin</strong> ou <strong>operador/operador</strong></p>
                    </div>
                </form>
            </Card>
            
            <div className="text-gray-500 text-xs mt-6 text-center">
                <p>&copy; 2025 LabControl - Estoque UMV.</p>
                <p className="mt-1">
                    Dev: <a href="https://www.linkedin.com/in/thiago-terto-eng-qu%C3%ADmico/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Thiago Terto</a>
                </p>
            </div>
        </div>
    );
};
