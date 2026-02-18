import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    LayoutGrid,
    History,
    ShoppingCart,
    BarChart3,
    Settings,
    FlaskConical,
    RefreshCw,
    LogOut
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
        { path: '/storage', icon: <LayoutGrid size={20} />, label: 'Armazenamento' },
        { path: '/history', icon: <History size={20} />, label: 'Histórico' },
        { path: '/purchases', icon: <ShoppingCart size={20} />, label: 'Compras' },
        { path: '/reports', icon: <BarChart3 size={20} />, label: 'Relatórios' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Configurações' },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full bg-orbital-bg border-r border-orbital-border">
            {/* Header / Logo */}
            <div className="flex items-center gap-3 px-6 h-16 border-b border-orbital-border bg-orbital-bg/50 backdrop-blur-sm">
                <div className="p-1.5 rounded bg-orbital-accent text-orbital-bg shadow-glow-sm">
                    <FlaskConical size={20} />
                </div>
                <div className="text-xl font-display font-bold tracking-tight text-orbital-text">
                    Lab<span className="text-orbital-accent">Control</span>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {menuItems.map((item) => {
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-none transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-orbital-accent/10 text-orbital-accent'
                                    : 'text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orbital-accent shadow-glow" />
                                    )}
                                    <div className={`relative ${isActive ? 'text-orbital-accent drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : ''}`}>
                                        {item.label === 'Inventário' && notificationsCount > 0 ? (
                                            <div className="relative">
                                                {item.icon}
                                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orbital-danger opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orbital-danger"></span>
                                                </span>
                                            </div>
                                        ) : (
                                            item.icon
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium ${isActive ? 'text-glow' : ''}`}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 bg-orbital-surface border-t border-orbital-border">
                <button
                    onClick={onSync}
                    className="flex items-center gap-3 w-full px-3 py-2 text-orbital-subtext hover:text-orbital-accent hover:bg-orbital-bg transition-colors mb-4 group"
                >
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    <div className="text-left">
                        <div className="text-sm font-medium">Sincronizar</div>
                        <div className="text-xs opacity-70">Backup manual</div>
                    </div>
                </button>

                <div className="flex items-center gap-3 p-2 rounded border border-orbital-border bg-orbital-bg">
                    <img
                        src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'}
                        alt={user?.name}
                        className="w-9 h-9 rounded bg-orbital-surface object-cover border border-orbital-border"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-orbital-text truncate">{user?.name || 'Usuário'}</div>
                        <div className="text-xs text-orbital-accent truncate capitalize">
                            {user?.role === 'ADMIN' ? 'Administrator' : 'Operator'}
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-1.5 text-orbital-subtext hover:text-orbital-danger hover:bg-orbital-danger/10 rounded transition-colors"
                        title="Sair"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 sm:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed top-0 bottom-0 left-0 z-50 w-64 bg-orbital-bg transform transition-transform duration-300 ease-in-out border-r border-orbital-border
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    sm:translate-x-0
                `}
                style={{ width: drawerWidth }}
            >
                {sidebarContent}
            </aside>
        </>
    );
};
