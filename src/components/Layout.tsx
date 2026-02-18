import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-orbital-bg text-orbital-text">
            <Header
                onToggleTheme={toggleTheme}
                onBackup={onBackupForce}
                onAddClick={onAddClick}
                onScanClick={onScanClick}
                notificationsCount={alertsCount}
                onMenuClick={handleDrawerToggle}
                drawerWidth={drawerWidth}
            />

            <Sidebar 
                onLogout={onLogout}
                notificationsCount={notificationsCount}
                onSync={onSync}
                isMobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
                drawerWidth={drawerWidth}
            />

            <main
                className="flex-1 flex flex-col min-w-0 transition-all duration-300 sm:pl-[260px]"
            >
                {/* Header Spacer */}
                <div className="h-16 shrink-0" />

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col relative">
                    {children}
                </div>
            </main>
        </div>
    );
};
