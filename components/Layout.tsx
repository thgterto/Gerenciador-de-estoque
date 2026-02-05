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
    
    // Close menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex bg-background h-screen w-screen font-sans overflow-hidden transition-colors duration-300">
            {/* Mobile Overlay - Soft Blur */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
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
       
            <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative transition-all bg-gray-50/50 dark:bg-gray-900">
                <Header 
                    onToggleTheme={toggleTheme}
                    onBackup={onBackupForce}
                    onAddClick={onAddClick}
                    onScanClick={onScanClick}
                    notificationsCount={alertsCount}
                    onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                    {/* Content */}
                    <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-0 md:p-0">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
