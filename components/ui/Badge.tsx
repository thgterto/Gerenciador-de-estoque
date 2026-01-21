
import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    icon?: string;
    className?: string;
    withDot?: boolean; // Novo estilo "Stitch"
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', icon, className = '', withDot = false }) => {
    // Cores refinadas para o design system Stitch
    const variants = {
        success: {
            bg: "bg-emerald-50 dark:bg-emerald-900/30",
            text: "text-emerald-700 dark:text-emerald-400",
            dot: "bg-emerald-600 dark:bg-emerald-400",
            border: "border-emerald-100 dark:border-emerald-900"
        },
        warning: {
            bg: "bg-amber-50 dark:bg-amber-900/30",
            text: "text-amber-700 dark:text-amber-400",
            dot: "bg-amber-600 dark:bg-amber-400",
            border: "border-amber-100 dark:border-amber-900"
        },
        danger: {
            bg: "bg-red-50 dark:bg-red-900/30",
            text: "text-red-700 dark:text-red-400",
            dot: "bg-red-600 dark:bg-red-400",
            border: "border-red-100 dark:border-red-900"
        },
        info: {
            bg: "bg-blue-50 dark:bg-blue-900/30",
            text: "text-blue-700 dark:text-blue-400",
            dot: "bg-blue-600 dark:bg-blue-400",
            border: "border-blue-100 dark:border-blue-900"
        },
        neutral: {
            bg: "bg-slate-100 dark:bg-slate-800",
            text: "text-slate-600 dark:text-slate-400",
            dot: "bg-slate-500 dark:bg-slate-400",
            border: "border-slate-200 dark:border-slate-700"
        },
        primary: {
            bg: "bg-primary/10",
            text: "text-primary dark:text-white",
            dot: "bg-primary",
            border: "border-primary/20"
        }
    };

    const style = variants[variant];

    return (
        <span className={`
            inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold 
            ${style.bg} ${style.text} border ${style.border} ${className}
        `}>
            {withDot && (
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`}></span>
            )}
            {icon && !withDot && (
                <span className="material-symbols-outlined text-[14px] -ml-0.5">{icon}</span>
            )}
            <span className="truncate">{children}</span>
        </span>
    );
};
