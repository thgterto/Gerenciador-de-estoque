import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';

// Icons
import {
    LayoutDashboard,
    Package,
    Grid,
    History,
    ShoppingCart,
    BarChart3,
    Settings,
    RefreshCw,
    LogOut,
    FlaskConical
} from 'lucide-react';

interface SidebarProps {
    onLogout: () => void;
    notificationsCount: number;
    onSync: () => void;
    isMobileOpen: boolean;
    onClose: () => void;
    drawerWidth: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
    onLogout,
    notificationsCount,
    onSync,
    isMobileOpen,
    onClose,
    drawerWidth
}) => {
    const { user } = useAuth();
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/inventory', icon: <Package size={20} />, label: 'Inventário' },
        { path: '/storage', icon: <Grid size={20} />, label: 'Armazenamento' },
        { path: '/history', icon: <History size={20} />, label: 'Histórico' },
        { path: '/purchases', icon: <ShoppingCart size={20} />, label: 'Compras' },
        { path: '/reports', icon: <BarChart3 size={20} />, label: 'Relatórios' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Configurações' },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full bg-orbital-bg border-r border-orbital-border text-gray-300">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-orbital-border/50 bg-orbital-bg/50 backdrop-blur-sm">
                <div className="p-2 rounded bg-orbital-primary/10 text-orbital-primary border border-orbital-primary/20">
                    <FlaskConical size={24} />
                </div>
                <div>
                    <h1 className="text-lg font-display font-bold text-white tracking-wide uppercase leading-none">
                        Lab<span className="text-orbital-primary">Control</span>
                    </h1>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                        v2.0 Orbital
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) => `
                                relative group flex items-center gap-3 px-3 py-2.5 rounded-sm
                                font-mono text-sm tracking-wide transition-all duration-200
                                ${isActive
                                    ? 'bg-orbital-primary/10 text-orbital-primary border border-orbital-primary/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent hover:border-white/10'
                                }
                            `}
                        >
                            <span className={`opacity-80 group-hover:opacity-100 ${isActive ? 'text-orbital-primary' : ''}`}>
                                {item.icon}
                            </span>
                            <span className="flex-1 font-medium">{item.label}</span>

                            {item.label === 'Inventário' && notificationsCount > 0 && (
                                <OrbitalBadge label={String(notificationsCount)} color="danger" size="sm" />
                            )}

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-orbital-primary shadow-[0_0_8px_rgba(34,211,238,0.8)] rounded-r-full" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-orbital-border/50 bg-orbital-card/30">
                <button
                    onClick={onSync}
                    className="w-full flex items-center gap-3 px-3 py-2.5 mb-4 rounded-sm
                             text-gray-400 hover:text-orbital-accent hover:bg-orbital-accent/5
                             border border-transparent hover:border-orbital-accent/20 transition-all group"
                >
                    <RefreshCw size={18} className="group-hover:animate-spin" />
                    <span className="font-mono text-xs uppercase tracking-wider font-bold">Sincronizar</span>
                </button>

                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-sm bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                        <img
                            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jules'}
                            alt="User"
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-200 truncate">{user?.name || 'Comandante'}</p>
                        <p className="text-[10px] font-mono text-orbital-primary truncate uppercase">
                            {user?.role === 'ADMIN' ? 'Administrator' : 'Operator'}
                        </p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-500 hover:text-orbital-danger hover:bg-orbital-danger/10 rounded-sm transition-colors"
                        title="Sair do Sistema"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed top-0 left-0 bottom-0 z-50
                    bg-orbital-bg w-[260px]
                    transform transition-transform duration-300 ease-out
                    lg:translate-x-0 lg:static border-r border-orbital-border shadow-2xl lg:shadow-none
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{ width: drawerWidth }}
            >
                {sidebarContent}
            </aside>
        </>
    );
};
