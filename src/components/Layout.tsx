import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const DRAWER_WIDTH = 260;

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
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-orbital-bg text-gray-100 font-sans selection:bg-orbital-primary/30 selection:text-white">
            {/* Sidebar (Fixed on Desktop, Drawer on Mobile) */}
            <Sidebar 
                onLogout={onLogout}
                notificationsCount={notificationsCount}
                onSync={onSync}
                isMobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
                drawerWidth={DRAWER_WIDTH}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-[260px] transition-all duration-300">

                {/* Fixed Header */}
                <Header
                    onToggleTheme={() => {}}
                    onBackup={onBackupForce}
                    onAddClick={onAddClick}
                    onScanClick={onScanClick}
                    notificationsCount={alertsCount}
                    onMenuClick={handleDrawerToggle}
                    drawerWidth={DRAWER_WIDTH}
                />

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 scroll-smooth custom-scrollbar">
                    <div className="min-h-full p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full relative">
                        {/* Grid Background Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                             style={{
                                backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`,
                                backgroundSize: '40px 40px'
                             }}
                        />

                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
