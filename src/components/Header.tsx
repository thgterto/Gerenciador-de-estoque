import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    Menu,
    Search,
    ScanLine,
    Plus,
    Sun,
    Moon,
    RefreshCw,
    Bell,
    FlaskConical
} from 'lucide-react';

interface HeaderProps {
    onToggleTheme: () => void;
    onBackup: () => void;
    onAddClick?: () => void;
    onScanClick?: () => void;
    notificationsCount: number;
    onMenuClick?: () => void;
    drawerWidth?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
    onToggleTheme,
    onBackup, 
    onAddClick,
    onScanClick, 
    notificationsCount,
    onMenuClick,
    drawerWidth = 240
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
        <header
            className="fixed top-0 right-0 left-0 z-30 h-16 bg-orbital-bg/90 backdrop-blur border-b border-orbital-border/30 transition-all duration-300"
            style={{ paddingLeft: `max(env(safe-area-inset-left), ${drawerWidth}px)` }}
        >
            <div className="flex items-center justify-between h-full px-4 sm:px-6">

                {/* Mobile Menu & Logo */}
                <div className="flex items-center gap-3 sm:hidden">
                    <button
                        onClick={onMenuClick}
                        className="p-2 -ml-2 text-orbital-subtext hover:text-orbital-accent rounded hover:bg-orbital-surface transition-colors"
                        aria-label="Abrir menu"
                    >
                        <Menu size={24} />
                    </button>
                    <FlaskConical className="text-orbital-accent" size={24} />
                </div>

                {/* Search Bar */}
                <div className="hidden md:flex flex-1 max-w-lg relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orbital-subtext group-focus-within:text-orbital-accent transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Busca global (Ctrl + K)..."
                        className="w-full bg-orbital-surface border border-orbital-border text-orbital-text text-sm rounded-none py-2 pl-10 pr-4 placeholder-orbital-subtext/50 focus:outline-none focus:border-orbital-accent focus:shadow-glow-sm transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-orbital-subtext border border-orbital-border rounded bg-orbital-bg font-mono">⌘K</kbd>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {onAddClick && (
                        <button
                            onClick={onAddClick}
                            className="p-2 text-orbital-accent hover:text-white hover:bg-orbital-accent/90 rounded transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                            title="Adicionar Item"
                            data-testid="header-add-button"
                        >
                            <Plus size={20} />
                        </button>
                    )}

                    {onScanClick && (
                         <button
                            onClick={onScanClick}
                            className="p-2 text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface rounded transition-colors"
                            title="Scanner"
                        >
                            <ScanLine size={20} />
                        </button>
                    )}

                    <button
                        onClick={onBackup}
                        className="p-2 text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface rounded transition-colors group"
                        title="Sincronizar"
                    >
                        <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    </button>

                    <button
                        onClick={onToggleTheme}
                        className="p-2 text-orbital-subtext hover:text-orbital-warning hover:bg-orbital-surface rounded transition-colors"
                        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button
                        className="p-2 text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface rounded transition-colors relative"
                        title="Notificações"
                    >
                        <Bell size={20} />
                        {notificationsCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orbital-danger opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orbital-danger"></span>
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};
