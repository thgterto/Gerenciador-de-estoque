
import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    icon?: string;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', icon, className = '' }) => {
    // Utilizando as cores semânticas definidas no tailwind.config.js
    const variants = {
        success: "bg-success-bg text-success-text ring-success/20",
        warning: "bg-warning-bg text-warning-text ring-warning/20",
        danger: "bg-danger-bg text-danger-text ring-danger/20",
        info: "bg-info-bg text-info-text ring-info/20",
        neutral: "bg-slate-100 text-slate-600 ring-slate-200",
        primary: "bg-primary-light text-primary ring-primary/20"
    };

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${variants[variant]} ${className}`}>
            {icon ? (
                <span className="material-symbols-outlined text-[14px] -ml-0.5">{icon}</span>
            ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50"></span>
            )}
            <span className="truncate">{children}</span>
        </span>
    );
};
