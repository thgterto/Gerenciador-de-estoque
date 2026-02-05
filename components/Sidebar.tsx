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
              w-full flex items-center gap-3 px-3 py-3 rounded-none transition-all duration-100 group relative select-none border-l-4
              ${isActive 
                  ? 'bg-primary text-black border-black font-bold'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-white border-transparent hover:border-primary font-medium'
              }
          `}
      >
          <div className="relative flex items-center justify-center">
              <Icon name={item.icon} size={24} filled={isActive} />
          </div>
          <span className="text-sm flex-1 text-left tracking-tight uppercase">{item.label}</span>
          
          {item.badge && item.badge > 0 && (
              <span className={`
                  text-[10px] font-bold px-1.5 py-0.5 min-w-[20px] text-center
                  ${isActive ? 'bg-black text-primary' : 'bg-primary text-black'}
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
            fixed md:relative top-0 left-0 h-full w-64 bg-sidebar z-40 flex flex-col
            border-r-2 border-primary/20 transition-transform duration-300 ease-in-out shadow-none
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Area */}
        <div className="h-auto py-6 flex flex-col px-4 bg-sidebar shrink-0 gap-6 border-b border-gray-800">
           <div className="flex items-center gap-3 px-2">
              <div className="bg-primary aspect-square size-10 flex items-center justify-center border-2 border-black">
                 <Icon name="science" size={28} className="text-black" />
              </div>
              <div className="flex flex-col">
                 <h1 className="text-white text-lg font-display font-bold leading-none tracking-tight uppercase">LabControl</h1>
                 <p className="text-primary text-[10px] font-mono tracking-widest uppercase mt-1">System v2.0</p>
              </div>
              {/* Mobile Close */}
               <button onClick={closeMobile} className="md:hidden ml-auto text-gray-400 hover:text-primary transition-colors">
                    <Icon name="close" size={24} />
               </button>
           </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-0 space-y-1 overflow-y-auto custom-scrollbar py-4">
            {visibleItems.map((item, index) => (
                <React.Fragment key={item.id}>
                    {item.sectionTitle && (
                         <div className={`px-6 mt-6 mb-2 flex items-center ${index === 0 ? 'mt-2' : ''}`}>
                            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 w-full pb-1">{item.sectionTitle}</span>
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
        <div className="p-0 border-t border-gray-800 shrink-0">
            <div 
                className="flex items-center gap-3 p-4 bg-gray-900/50 cursor-pointer hover:bg-gray-900 transition-colors group"
                onClick={onLogout}
                role="button"
                tabIndex={0}
            >
                <div className="size-9 rounded-none bg-cover bg-center border border-gray-600 shrink-0" style={{backgroundImage: `url(${user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'})`}}></div>
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-gray-400 truncate capitalize font-mono">{user?.role === 'ADMIN' ? 'ADMIN' : 'OPERATOR'}</p>
                </div>
                <Tooltip content="Sair" position="top">
                    <Icon name="logout" className="text-gray-500 group-hover:text-danger transition-colors" size={20} />
                </Tooltip>
            </div>
        </div>
      </aside>
    </>
  );
};
