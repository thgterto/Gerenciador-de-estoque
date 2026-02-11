import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PersistenceStatus } from './PersistenceStatus';

interface LayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    notificationsCount: number;
    alertsCount: number;
    onSync: () => void;
    onBackupForce: () => void;
    onAddClick: () => void;
    onScanClick: () => void;
    onToggleTheme: () => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, 
    onLogout, 
    notificationsCount,
    // alertsCount, // Unused
    onSync,
    onBackupForce,
    onAddClick,
    onScanClick,
    onToggleTheme,
    sidebarOpen,
    setSidebarOpen
}) => {
    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
            <Sidebar 
                onLogout={onLogout}
                notificationsCount={notificationsCount}
                onSync={onSync}
                isMobileOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onAddClick={onAddClick}
                onScanClick={onScanClick}
                onTransitionEnd={() => {}}
                drawerWidth={240}
            />
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <Header
                    onToggleTheme={onToggleTheme}
                    onBackup={onBackupForce}
                    notificationsCount={notificationsCount}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className="flex-1 overflow-auto relative flex flex-col custom-scrollbar">
                    {children}
                </main>
                <PersistenceStatus />
            </div>
        </div>
    );
};
