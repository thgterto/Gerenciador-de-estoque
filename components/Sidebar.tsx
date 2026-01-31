
import React, { useMemo } from 'react';
import { Tooltip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { Icon } from './ui/Icon';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
  onSync?: () => void;
  notificationsCount?: number;
  isMobileOpen?: boolean;
  closeMobile?: () => void;
}

interface MenuItem {
    id: string;
    path: string;
    label: string;
    icon: string;
    badge?: number;
    sectionTitle?: string; 
    requiredRole?: 'ADMIN' | 'OPERATOR';
}

interface NavButtonProps {
    item: MenuItem;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onClick }) => {
    return (
      <button 
          onClick={onClick} 
          className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative select-none
              ${isActive 
                  ? 'bg-primary/10 text-primary dark:text-white font-semibold' 
                  : 'text-text-secondary dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-white font-medium'
              }
          `}
      >
          <div className={`relative flex items-center justify-center`}>
              <Icon name={item.icon} size={24} filled={isActive} />
          </div>
          <span className="text-sm flex-1 text-left tracking-tight">{item.label}</span>
          
          {item.badge && item.badge > 0 && (
              <span className={`
                  text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}
              `}>
                  {item.badge}
              </span>
          )}
      </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, notificationsCount = 0, isMobileOpen = false, closeMobile }) => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentPath = location.pathname;

  const menuItems = useMemo<MenuItem[]>(() => [
      { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'inventory', path: '/inventory', label: 'Estoque', icon: 'inventory_2', sectionTitle: 'Operacional' },
      { id: 'purchases', path: '/purchases', label: 'Pedidos', icon: 'shopping_cart', badge: notificationsCount },
      { id: 'storage', path: '/storage', label: 'Armazenamento', icon: 'grid_on' },
      { id: 'history', path: '/history', label: 'Histórico', icon: 'history' },
      { id: 'reports', path: '/reports', label: 'Relatórios', icon: 'bar_chart', sectionTitle: 'Gestão' },
      { id: 'settings', path: '/settings', label: 'Configurações', icon: 'settings', requiredRole: 'ADMIN' }
  ], [notificationsCount]);

  const visibleItems = menuItems.filter(item => !item.requiredRole || hasRole(item.requiredRole));

  const handleNavigation = (path: string) => {
      navigate(path);
      if (closeMobile) closeMobile();
  };

  const isActive = (path: string) => {
      if (path === '/dashboard' && currentPath === '/') return true;
      return currentPath.startsWith(path);
  }

  return (
    <>
      {/* Sidebar Container */}
      <aside 
        id="tour-sidebar" 
        className={`
            fixed md:relative top-0 left-0 h-full w-64 bg-surface-light dark:bg-surface-dark z-40 flex flex-col 
            border-r border-border-light dark:border-border-dark transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Area */}
        <div className="h-auto py-6 flex flex-col px-4 bg-surface-light dark:bg-surface-dark shrink-0 gap-6">
           <div className="flex items-center gap-3 px-2">
              <div className="bg-primary aspect-square rounded-lg size-10 flex items-center justify-center shadow-md">
                 <Icon name="science" size={28} className="text-white" />
              </div>
              <div className="flex flex-col">
                 <h1 className="text-text-main dark:text-white text-lg font-display font-bold leading-none tracking-tight">LabControl</h1>
                 <p className="text-text-secondary dark:text-gray-400 text-[11px] font-medium tracking-wide uppercase mt-0.5">Gestão de Estoque</p>
              </div>
              {/* Mobile Close */}
               <button onClick={closeMobile} className="md:hidden ml-auto text-text-secondary hover:text-primary transition-colors">
                    <Icon name="close" size={24} />
               </button>
           </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {visibleItems.map((item, index) => (
                <React.Fragment key={item.id}>
                    {item.sectionTitle && (
                         <div className={`px-3 mt-6 mb-2 flex items-center ${index === 0 ? 'mt-2' : ''}`}>
                            <span className="text-xs font-semibold text-text-light dark:text-gray-500 uppercase tracking-wider">{item.sectionTitle}</span>
                         </div>
                    )}
                    <NavButton 
                        item={item} 
                        isActive={isActive(item.path)}
                        onClick={() => handleNavigation(item.path)}
                    />
                </React.Fragment>
            ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-border-light dark:border-border-dark shrink-0">
            <div 
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" 
                onClick={onLogout}
                role="button"
                tabIndex={0}
            >
                <div className="size-9 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-600 shadow-sm shrink-0" style={{backgroundImage: `url(${user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'})`}}></div>
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium text-text-main dark:text-white truncate">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-text-secondary dark:text-gray-400 truncate capitalize">{user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</p>
                </div>
                <Tooltip content="Sair" position="top">
                    <Icon name="logout" className="text-text-light group-hover:text-danger transition-colors" size={20} />
                </Tooltip>
            </div>
        </div>
      </aside>
    </>
  );
};
