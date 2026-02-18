import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    LayoutGrid,
    History,
    ShoppingCart,
    BarChart3,
    Settings
} from 'lucide-react';

export const BottomNav: React.FC = () => {
    const menuItems = [
        { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dash' },
        { path: '/inventory', icon: <Package size={20} />, label: 'Items' },
        { path: '/storage', icon: <LayoutGrid size={20} />, label: 'Matrix' },
        // { path: '/history', icon: <History size={20} />, label: 'Hist' }, // Limited space on bottom nav, maybe hide some?
        { path: '/purchases', icon: <ShoppingCart size={20} />, label: 'Buy' },
        { path: '/reports', icon: <BarChart3 size={20} />, label: 'Rpts' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Cfg' },
    ];

    // Filter to 5 items max for better mobile UX, or use scroll
    // Let's keep 5 main ones and maybe put others in "More"?
    // For simplicity, let's just show top 5 relevant for mobile ops.
    const mobileItems = [
        { path: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dash' },
        { path: '/inventory', icon: <Package size={22} />, label: 'Items' },
        { path: '/purchases', icon: <ShoppingCart size={22} />, label: 'Buy' },
        { path: '/storage', icon: <LayoutGrid size={22} />, label: 'Locs' },
        { path: '/settings', icon: <Settings size={22} />, label: 'Config' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-orbital-bg/95 backdrop-blur-md border-t border-orbital-border z-50 flex items-center justify-around px-2 pb-safe sm:hidden">
            {mobileItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                        flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200
                        ${isActive
                            ? 'text-orbital-accent scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                            : 'text-orbital-subtext hover:text-orbital-text'}
                    `}
                >
                    {item.icon}
                    <span className="text-[10px] font-medium mt-1 tracking-wide">{item.label}</span>
                </NavLink>
            ))}
        </div>
    );
};
