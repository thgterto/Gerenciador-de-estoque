
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    onSync: () => void;
    onBackupForce: () => void;
    notificationsCount: number;
    alertsCount: number;
    onAddClick?: () => void;
    onScanClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, 
    onLogout, 
    onSync,
    onBackupForce,
    notificationsCount, 
    alertsCount,
    onAddClick,
    onScanClick
}) => {
    const { toggleTheme } = useTheme();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Fecha o menu ao mudar de rota
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex bg-background-light dark:bg-background-dark h-screen w-screen font-display overflow-hidden transition-colors duration-200">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar 
                onLogout={onLogout} 
                notificationsCount={notificationsCount} 
                onSync={onSync}
                isMobileOpen={isMobileMenuOpen}
                closeMobile={() => setIsMobileMenuOpen(false)}
            />
       
            {/* Removed md:ml-64 because Sidebar is relative in desktop flex container */}
            <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative transition-all">
                <Header 
                    onToggleTheme={toggleTheme}
                    onBackup={onBackupForce}
                    onAddClick={onAddClick}
                    onScanClick={onScanClick}
                    notificationsCount={alertsCount}
                    onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-200">
                    {children}
                </div>
            </main>
        </div>
    );
};
