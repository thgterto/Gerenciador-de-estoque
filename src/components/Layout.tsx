import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useTheme } from '../context/ThemeContext';

const drawerWidth = 260;

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

    return (
        <div className="flex h-screen overflow-hidden bg-orbital-bg text-orbital-text">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-orbital-accent focus:text-orbital-bg focus:rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orbital-accent focus:font-display focus:font-bold"
            >
                Pular para o conteúdo principal
            </a>
            <Header
                onToggleTheme={toggleTheme}
                onBackup={onBackupForce}
                onAddClick={onAddClick}
                onScanClick={onScanClick}
                notificationsCount={alertsCount}
                onMenuClick={() => {}}
                drawerWidth={drawerWidth}
            />

            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden sm:block">
                <Sidebar
                    onLogout={onLogout}
                    notificationsCount={notificationsCount}
                    onSync={onSync}
                    isMobileOpen={false}
                    onClose={() => {}}
                    drawerWidth={drawerWidth}
                />
            </div>

            <main
                className="flex-1 flex flex-col min-w-0 transition-all duration-300 sm:pl-[260px]"
            >
                {/* Header Spacer */}
                <div className="h-16 shrink-0" />

                {/* Scrollable Content Area */}
                <div id="main-content" tabIndex={-1} className="flex-1 overflow-hidden flex flex-col relative pb-16 sm:pb-0 outline-none">
                    {/* Added pb-16 for mobile bottom nav spacer */}
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
};
