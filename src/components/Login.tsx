import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { User, Lock, FlaskConical, LogIn } from 'lucide-react';

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
        <div className="min-h-screen bg-orbital-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-orbital-accent shadow-[0_0_20px_rgba(6,182,212,0.5)] z-10" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orbital-accent/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orbital-warning/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="w-full max-w-md z-20 animate-fade-in">
                <OrbitalCard noPadding className="border-orbital-accent/30 shadow-glow-lg backdrop-blur-md bg-orbital-surface/90">
                    <div className="p-8 text-center border-b border-orbital-border relative overflow-hidden">
                        <div className="absolute inset-0 bg-orbital-accent/5" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-orbital-bg rounded-full mb-4 text-orbital-accent border border-orbital-accent/50 shadow-glow-sm mx-auto">
                                <FlaskConical size={40} />
                            </div>
                            <h1 className="text-3xl font-display font-black text-orbital-text tracking-tight uppercase">
                                Lab<span className="text-orbital-accent">Control</span>
                            </h1>
                            <p className="text-orbital-subtext text-sm mt-2 font-mono uppercase tracking-widest">
                                Sistema de Controle UMV
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <OrbitalInput
                            label="Usuário"
                            placeholder="Digite seu usuário"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                            startAdornment={<User size={18} />}
                        />

                        <OrbitalInput
                            label="Senha"
                            type="password"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            startAdornment={<Lock size={18} />}
                        />

                        <OrbitalButton
                            type="submit"
                            isLoading={isLoading}
                            disabled={isLoading}
                            className="w-full"
                            size="lg"
                            icon={<LogIn size={20} />}
                        >
                            {isLoading ? 'Acessando...' : 'Entrar no Sistema'}
                        </OrbitalButton>

                        <div className="text-center text-xs text-orbital-subtext mt-4 font-mono opacity-70">
                            <p>Credenciais padrão: <span className="text-orbital-text">admin</span> / <span className="text-orbital-text">admin</span></p>
                        </div>
                    </form>
                </OrbitalCard>

                <div className="text-orbital-subtext/50 text-[10px] mt-8 text-center font-mono uppercase tracking-wider">
                    <p>&copy; 2025 LabControl - v1.8.0 Orbital</p>
                    <p className="mt-1">
                        Dev: <a href="#" className="hover:text-orbital-accent transition-colors">Thiago Terto</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
