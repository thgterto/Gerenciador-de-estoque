import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './ui/Icon';
import { useAuth } from '../context/AuthContext';
import { Tooltip } from './Tooltip';

interface SidebarProps {
    onLogout: () => void;
    notificationsCount: number;
    onSync: () => void;
    isMobileOpen: boolean;
    closeMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    onLogout,
    notificationsCount,
    isMobileOpen,
    closeMobile
}) => {
    const { user } = useAuth();

    const menuItems = [
        { path: '/', icon: 'dashboard', label: 'Dashboard' },
        { path: '/inventory', icon: 'inventory_2', label: 'Inventário' },
        { path: '/purchases', icon: 'shopping_cart', label: 'Compras' },
        { path: '/reports', icon: 'bar_chart', label: 'Relatórios' },
        { path: '/settings', icon: 'settings', label: 'Configurações' },
    ];

    const sidebarClass = isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0';

    return (
        <>
      {/* Sidebar Container */}
      <aside className={`fixed md:relative z-40 w-64 h-full bg-sidebar border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out shadow-xl md:shadow-none ${sidebarClass}`}>

        {/* Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-sidebar shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg">
                    <Icon name="science" className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                    Lab<span className="text-secondary">Control</span>
                </span>
            </div>
            <button onClick={closeMobile} className="md:hidden ml-auto text-gray-400 hover:text-white">
                <Icon name="close" size={24} />
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
            {menuItems.map((item) => (
                <React.Fragment key={item.path}>
                    <NavLink
                        to={item.path}
                        onClick={closeMobile}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                                isActive
                                    ? 'bg-white/10 text-white shadow-sm border-l-4 border-secondary pl-3' // Active: Soft BG + Lime Border
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-5' // Inactive
                            }`
                        }
                    >
                        <Icon name={item.icon} size={20} className="group-hover:scale-110 transition-transform duration-200" />
                        <span className="truncate">{item.label}</span>
                        {item.path === '/inventory' && notificationsCount > 0 && (
                            <span className="ml-auto bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                {notificationsCount}
                            </span>
                        )}
                    </NavLink>
                </React.Fragment>
            ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-0 border-t border-gray-800 shrink-0 bg-gray-900/30">
            <div 
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors group"
                onClick={onLogout}
                role="button"
                tabIndex={0}
            >
                <div className="size-10 rounded-full bg-cover bg-center border-2 border-gray-700 shadow-sm shrink-0" style={{backgroundImage: `url(${user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'})`}}></div>
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-secondary transition-colors">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-gray-500 truncate capitalize font-mono">{user?.role === 'ADMIN' ? 'Administrator' : 'Operator'}</p>
                </div>
                <Tooltip content="Sair" position="top">
                    <div className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <Icon name="logout" className="text-gray-500 group-hover:text-danger transition-colors" size={18} />
                    </div>
                </Tooltip>
            </div>
        </div>
      </aside>
    </>
  );
};
