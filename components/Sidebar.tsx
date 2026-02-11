import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Divider, Typography, Avatar, IconButton, Tooltip, Badge
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import GridViewIcon from '@mui/icons-material/GridView';
import HistoryIcon from '@mui/icons-material/History';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ScienceIcon from '@mui/icons-material/Science';
import SyncIcon from '@mui/icons-material/Sync';
import LogoutIcon from '@mui/icons-material/Logout';

interface SidebarProps {
    onLogout: () => void;
    notificationsCount: number;
    onSync: () => void;
    isMobileOpen: boolean;
    onClose: () => void;
    onTransitionEnd: () => void;
    drawerWidth: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
    onLogout,
    notificationsCount,
    onSync,
    isMobileOpen,
    onClose,
    onTransitionEnd,
    drawerWidth
}) => {
    const { user } = useAuth();
    const location = useLocation();
    const theme = useTheme();

    const menuItems = [
        { path: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
        { path: '/inventory', icon: <InventoryIcon />, label: 'Inventário' },
        { path: '/storage', icon: <GridViewIcon />, label: 'Armazenamento' },
        { path: '/history', icon: <HistoryIcon />, label: 'Histórico' },
        { path: '/purchases', icon: <ShoppingCartIcon />, label: 'Compras' },
        { path: '/reports', icon: <BarChartIcon />, label: 'Relatórios' },
        { path: '/settings', icon: <SettingsIcon />, label: 'Configurações' },
    ];

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header / Logo */}
            <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3 }}>
                <Box sx={{
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex'
                }}>
                    <ScienceIcon fontSize="medium" />
                </Box>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                    Lab<Box component="span" sx={{ color: 'secondary.main' }}>Control</Box>
                </Typography>
            </Toolbar>
            <Divider />

            {/* Navigation Items */}
            <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={NavLink}
                                to={item.path}
                                selected={isActive}
                                onClick={onClose} // Close drawer on mobile click
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        onClose();
                                    }
                                }}
                                sx={{
                                    borderRadius: 2,
                                    '&.active': {
                                        bgcolor: 'primary.main', // Should be primary.light with opacity usually, but 'selected' handles it partially
                                        color: 'primary.contrastText',
                                        '& .MuiListItemIcon-root': {
                                            color: 'inherit',
                                        },
                                    },
                                    // Custom active styling override if needed
                                    ...(isActive && {
                                        bgcolor: theme.palette.primary.light + '20', // 20% opacity
                                        color: theme.palette.primary.main,
                                        '&:hover': {
                                             bgcolor: theme.palette.primary.light + '30',
                                        }
                                    })
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : 'text.secondary' }}>
                                    {item.label === 'Inventário' && notificationsCount > 0 ? (
                                        <Badge badgeContent={notificationsCount} color="error" variant="dot">
                                            {item.icon}
                                        </Badge>
                                    ) : (
                                        item.icon
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 400 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider />

            {/* Footer Actions */}
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                <ListItemButton onClick={onSync} sx={{ borderRadius: 2, mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><SyncIcon /></ListItemIcon>
                    <ListItemText primary="Sincronizar" secondary="Backup manual" />
                </ListItemButton>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, p: 1 }}>
                    <Avatar
                        src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'}
                        alt={user?.name}
                        sx={{ width: 40, height: 40, border: '2px solid', borderColor: 'divider' }}
                    />
                    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Typography variant="subtitle2" noWrap>{user?.name || 'Usuário'}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ textTransform: 'capitalize' }}>
                            {user?.role === 'ADMIN' ? 'Administrator' : 'Operator'}
                        </Typography>
                    </Box>
                    <Tooltip title="Sair">
                        <IconButton onClick={onLogout} size="small" color="default">
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="mailbox folders"
        >
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={isMobileOpen}
                onTransitionEnd={onTransitionEnd}
                onClose={onClose}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};
