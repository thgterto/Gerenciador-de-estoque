import React, { useState } from 'react';
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
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
                    p: { xs: 2, sm: 3 },
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    overflowX: 'hidden'
                }}
            >
                <Toolbar /> {/* Spacer to push content below AppBar */}
                {children}
            </Box>
        </Box>
    );
};
