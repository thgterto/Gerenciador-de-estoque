import React, { useRef, useEffect } from 'react';
import {
    AppBar, Toolbar, IconButton, InputBase, Box, Badge, Tooltip
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { useTheme } from '../context/ThemeContext';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AddIcon from '@mui/icons-material/Add';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ScienceIcon from '@mui/icons-material/Science';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

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
    drawerWidth = 240
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
        <AppBar
            position="fixed"
            sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 1
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Mobile Logo */}
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', mr: 2 }}>
                    <ScienceIcon color="primary" />
                </Box>

                <Search sx={{ display: { xs: 'none', md: 'block' }, bgcolor: 'action.hover' }}>
                    <SearchIconWrapper>
                        <SearchIcon />
                    </SearchIconWrapper>
                    <StyledInputBase
                        placeholder="Busca global (Ctrl + K)..."
                        inputProps={{ 'aria-label': 'search' }}
                        inputRef={searchInputRef}
                    />
                </Search>

                <Box sx={{ flexGrow: 1 }} />

                <Box sx={{ display: 'flex' }}>
                     {onAddClick && (
                        <Tooltip title="Adicionar Item">
                            <IconButton onClick={onAddClick} color="primary" size="large">
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    {onScanClick && (
                         <Tooltip title="Scanner">
                            <IconButton onClick={onScanClick} color="inherit" size="large">
                                <QrCodeScannerIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="Sincronizar">
                        <IconButton onClick={onBackup} color="inherit" size="large">
                            <CloudSyncIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}>
                        <IconButton onClick={toggleTheme} color="inherit" size="large">
                            {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Notificações">
                        <IconButton size="large" color="inherit">
                            <Badge badgeContent={notificationsCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};
