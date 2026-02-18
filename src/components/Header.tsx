import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { OrbitalButton } from './ui/orbital/OrbitalButton';

// Icons
import {
    Menu,
    Search,
    QrCode,
    Plus,
    Sun,
    Moon,
    CloudCog,
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
    onBackup, 
    onAddClick,
    onScanClick, 
    notificationsCount,
    onMenuClick,
    drawerWidth = 260
}) => {
    const { theme, toggleTheme } = useTheme();
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
            className="fixed top-0 right-0 z-30 flex items-center h-16 bg-orbital-bg/80 backdrop-blur-md border-b border-orbital-border px-4 lg:px-6 shadow-md"
            style={{ width: `calc(100% - ${window.innerWidth >= 1024 ? drawerWidth : 0}px)` }} // Only offset on desktop
        >
            {/* Mobile Menu Trigger */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 mr-3 text-orbital-primary hover:bg-orbital-primary/10 rounded-sm"
            >
                <Menu size={24} />
            </button>

            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center mr-auto text-orbital-primary">
                <FlaskConical size={24} />
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-xl relative group">
                <div className="absolute left-3 text-gray-500 group-focus-within:text-orbital-primary transition-colors">
                    <Search size={18} />
                </div>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="COMANDO DE BUSCA (CTRL + K)..."
                    className="w-full bg-orbital-card border border-orbital-border rounded-sm py-2 pl-10 pr-4
                             text-sm font-mono text-gray-200 placeholder-gray-600
                             focus:outline-none focus:border-orbital-primary/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.1)]
                             transition-all duration-200 uppercase tracking-wide"
                />
                <div className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 border border-gray-700 rounded bg-gray-900">
                    ⌘K
                </div>
            </div>

            <div className="flex-1 lg:flex-none" />

            {/* Actions Toolbar */}
            <div className="flex items-center gap-2 md:gap-4">
                {onAddClick && (
                    <OrbitalButton
                        variant="primary"
                        size="sm"
                        onClick={onAddClick}
                        className="hidden md:flex"
                        startIcon={<Plus size={16} />}
                    >
                        NOVO ITEM
                    </OrbitalButton>
                )}

                <div className="h-6 w-px bg-orbital-border mx-1 hidden md:block" />

                {onScanClick && (
                    <button
                        onClick={onScanClick}
                        className="p-2 text-gray-400 hover:text-orbital-primary hover:bg-orbital-primary/5 rounded-sm transition-colors relative group"
                        title="Scanner"
                    >
                        <QrCode size={20} />
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orbital-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </button>
                )}

                <button
                    onClick={onBackup}
                    className="p-2 text-gray-400 hover:text-orbital-accent hover:bg-orbital-accent/5 rounded-sm transition-colors relative group"
                    title="Backup / Sync"
                >
                    <CloudCog size={20} />
                </button>

                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/5 rounded-sm transition-colors"
                    title="Alternar Tema"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button
                    className="p-2 text-gray-400 hover:text-orbital-danger hover:bg-orbital-danger/5 rounded-sm transition-colors relative"
                    title="Notificações"
                >
                    <Bell size={20} />
                    {notificationsCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orbital-danger rounded-full animate-pulse shadow-[0_0_5px_#ef4444]" />
                    )}
                </button>
            </div>
        </header>
    );
};
