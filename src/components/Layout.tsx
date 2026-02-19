import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const drawerWidth = 260; // Slightly wider for better legibility

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
    const [isClosing, setIsClosing] = useState(false);

    const handleDrawerClose = () => {
        setIsClosing(true);
        setMobileOpen(false);
    };

    const handleDrawerTransitionEnd = () => {
        setIsClosing(false);
    };

    const handleDrawerToggle = () => {
        if (!isClosing) {
            setMobileOpen(!mobileOpen);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
            <Header
                onToggleTheme={() => {}} // Theme toggle is handled inside Header or Context now
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
                onTransitionEnd={handleDrawerTransitionEnd}
                onClose={handleDrawerClose}
                drawerWidth={drawerWidth}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    // Remove padding from here to let PageContainer control it or use it as a flex container
                    // But we keep it if children expect it. PageContainer has its own padding.
                    // To prevent double scrolling, we make this a flex column.
                    display: 'flex',
                    flexDirection: 'column',
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    height: '100vh',
                    bgcolor: 'background.default',
                    overflow: 'hidden'
                }}
            >
                <Toolbar /> {/* Spacer to push content below AppBar */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};
