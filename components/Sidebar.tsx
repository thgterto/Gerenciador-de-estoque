
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
              w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative select-none
              ${isActive 
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white font-semibold' 
                  : 'text-text-secondary dark:text-gray-400 hover:bg-background-light dark:hover:bg-slate-800 hover:text-text-main dark:hover:text-slate-200 font-medium'
              }
          `}
      >
          {/* Active indicator bar */}
          {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-primary rounded-r-md"></div>
          )}

          <div className={`relative flex items-center justify-center transition-colors ${isActive ? 'text-primary dark:text-white' : 'text-text-secondary dark:text-gray-500 group-hover:text-text-main dark:group-hover:text-gray-300'}`}>
              <Icon name={item.icon} size={20} filled={isActive} />
          </div>
          <span className="text-sm flex-1 text-left tracking-tight">{item.label}</span>
          
          {item.badge && item.badge > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm min-w-[20px] text-center">
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
      { id: 'dashboard', path: '/dashboard', label: 'Visão Geral', icon: 'dashboard' },
      { id: 'inventory', path: '/inventory', label: 'Inventário', icon: 'inventory_2', sectionTitle: 'Estoque' },
      { id: 'storage', path: '/storage', label: 'Armazenamento', icon: 'grid_on' },
      { id: 'purchases', path: '/purchases', label: 'Pedidos de Compra', icon: 'shopping_cart', badge: notificationsCount, sectionTitle: 'Operações' },
      { id: 'history', path: '/history', label: 'Histórico', icon: 'history' },
      { id: 'reports', path: '/reports', label: 'Relatórios', icon: 'bar_chart', sectionTitle: 'Gestão' },
      { id: 'users', path: '/users', label: 'Usuários', icon: 'group', requiredRole: 'ADMIN' },
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
            fixed md:relative top-0 left-0 h-full w-64 bg-surface-light dark:bg-sidebar z-40 flex flex-col 
            border-r border-border-light dark:border-border-dark transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Area */}
        <div className="h-16 flex items-center justify-between px-4 bg-surface-light dark:bg-sidebar border-b border-border-light dark:border-border-dark shrink-0">
           <div className="flex items-center gap-3">
              <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-lg text-primary dark:text-white flex items-center justify-center">
                 <Icon name="science" size={24} />
              </div>
              <div>
                 <h1 className="text-text-main dark:text-white text-base font-bold leading-none tracking-tight">LabControl</h1>
                 <p className="text-text-secondary dark:text-gray-400 text-[10px] font-semibold mt-0.5 tracking-wider uppercase">Estoque UMV</p>
              </div>
           </div>
           {/* Mobile Close */}
           <button onClick={closeMobile} className="md:hidden text-text-secondary hover:text-primary transition-colors">
                <Icon name="close" size={24} />
           </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
            {visibleItems.map((item, index) => (
                <React.Fragment key={item.id}>
                    {item.sectionTitle && (
                         <div className={`px-3 mt-6 mb-2 flex items-center ${index === 0 ? 'mt-2' : ''}`}>
                            <span className="text-[11px] font-bold text-text-light dark:text-gray-500 uppercase tracking-widest">{item.sectionTitle}</span>
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

        {/* Developer Signature */}
        <div className="px-4 py-1 text-center shrink-0">
            <div className="flex justify-between items-center text-[10px] text-text-light dark:text-gray-500 font-mono">
                <a href="https://www.linkedin.com/in/thiago-terto-eng-qu%C3%ADmico/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    Dev: Thiago Terto
                </a>
                <span>v1.8.0</span>
            </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 bg-background-light dark:bg-slate-900/50 border-t border-border-light dark:border-border-dark shrink-0">
            <div 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light dark:hover:bg-slate-800 cursor-pointer transition-colors group border border-transparent hover:border-border-light dark:hover:border-slate-700" 
                onClick={onLogout}
                role="button"
                tabIndex={0}
            >
                <div className="w-9 h-9 rounded-full bg-surface-light dark:bg-slate-700 border border-border-light dark:border-slate-600 flex items-center justify-center text-text-secondary dark:text-white text-xs font-bold overflow-hidden shadow-sm">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <span>{user?.name.substring(0, 2).toUpperCase()}</span>
                    )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main dark:text-white truncate">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-text-secondary dark:text-gray-400 truncate capitalize">{user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</p>
                </div>
                <Tooltip content="Sair" position="top">
                    <Icon name="logout" className="text-text-light group-hover:text-danger transition-colors" size={18} />
                </Tooltip>
            </div>
        </div>
      </aside>
    </>
  );
};
