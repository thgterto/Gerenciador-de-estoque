
import React, { useRef, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Input } from './ui/Input';

interface HeaderProps {
    onToggleTheme: () => void;
    onBackup: () => void;
    onAddClick?: () => void;
    onScanClick?: () => void; // New Prop
    notificationsCount: number;
    className?: string;
    onMenuClick?: () => void; 
}

export const Header: React.FC<HeaderProps> = ({ 
    onToggleTheme, 
    onBackup, 
    onAddClick,
    onScanClick, 
    notificationsCount,
    className = '',
    onMenuClick
}) => {
    const { theme } = useTheme();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Hotkey: Ctrl + K (or Cmd + K) to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <header className={`h-16 flex items-center justify-between px-6 md:px-8 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark shrink-0 z-20 transition-colors duration-200 ${className}`}>
            
            {/* Mobile Menu Trigger & Logo */}
            <div className="flex items-center gap-3 md:hidden">
                <button 
                    onClick={onMenuClick}
                    className="p-1 text-text-secondary dark:text-text-light hover:text-primary transition-colors"
                >
                    <Icon name="menu" size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                        <Icon name="science" size={20} />
                    </div>
                    <span className="font-bold text-lg text-text-main dark:text-white hidden sm:inline">LabControl</span>
                </div>
            </div>

            {/* Global Search (Polaris-like) */}
            <div className="flex-1 max-w-xl mr-4 hidden md:block">
                 <Input 
                    ref={searchInputRef}
                    placeholder="Busca global (Ctrl + K)..." 
                    icon="search"
                    className="bg-background-light dark:bg-background-dark border-transparent focus:bg-surface-light dark:focus:bg-surface-dark shadow-none"
                    rightElement={
                        <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-bold text-text-light bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded shadow-sm opacity-60">⌘K</kbd>
                    }
                 />
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center gap-2 md:gap-3 ml-auto">
                {/* Mobile Scanner Button */}
                <button 
                    onClick={onScanClick}
                    className="md:hidden p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Scanner Rápido"
                >
                     <Icon name="qr_code_scanner" size={22} />
                </button>

                {onAddClick && (
                    <Button 
                        variant="primary"
                        size="md"
                        icon="add"
                        className="hidden md:flex font-semibold shadow-sm"
                        onClick={onAddClick}
                        title="Adicionar Novo Item"
                    >
                        Adicionar Item
                    </Button>
                )}

                <div className="h-6 w-px bg-border-light dark:bg-border-dark mx-1 hidden md:block"></div>
                
                {/* Desktop Scanner Button (Optional/Secondary) */}
                 <Button 
                    variant="ghost"
                    size="md"
                    className="w-9 px-0 justify-center text-text-secondary dark:text-text-light hover:bg-slate-100 dark:hover:bg-slate-800 hidden md:flex"
                    onClick={onScanClick}
                    title="Scanner de Código"
                    icon="qr_code_scanner"
                />

                <Button 
                    variant="ghost"
                    size="md"
                    className="w-9 px-0 justify-center text-text-secondary dark:text-text-light hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={onToggleTheme}
                    title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                    icon={theme === 'dark' ? 'light_mode' : 'dark_mode'}
                />

                <Button 
                    variant="ghost"
                    size="md"
                    className="w-9 px-0 justify-center text-secondary hover:text-secondary-hover dark:text-slate-400 dark:hover:text-white transition-colors"
                    onClick={onBackup}
                    title="Sincronizar"
                    icon="cloud_sync"
                />
                
                <Button 
                    variant="ghost"
                    size="md"
                    className="w-9 px-0 justify-center text-text-secondary dark:text-text-light relative hover:bg-slate-100 dark:hover:bg-slate-800"
                    id="tour-add-btn"
                    title="Notificações"
                    icon="notifications"
                >
                    {notificationsCount > 0 && (
                        <span className="absolute top-2 right-2 size-2 bg-danger-bg border border-white dark:border-surface-dark rounded-full">
                            <span className="absolute inset-0 bg-danger rounded-full animate-ping opacity-75"></span>
                            <span className="absolute inset-0 bg-danger rounded-full"></span>
                        </span>
                    )}
                </Button>
            </div>
        </header>
    );
};
