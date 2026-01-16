
import React from 'react';
import { Icon } from './Icon';

export type CardVariant = 'default' | 'metric' | 'item' | 'interactive' | 'flat';
export type ColorScheme = 'neutral' | 'primary' | 'warning' | 'danger' | 'success' | 'info';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    value?: string | number;
    icon?: string;
    variant?: CardVariant;
    colorScheme?: ColorScheme;
    padding?: string;
    className?: string;
    noBorder?: boolean;
    badge?: { label: string; color?: string; };
    action?: React.ReactNode;
    onClick?: () => void;
    delay?: number;
}

export const Card: React.FC<CardProps> = ({ 
    children, title, subtitle, value, icon,
    variant = 'default',
    colorScheme = 'neutral',
    padding = 'p-5',
    className = '',
    noBorder = false,
    badge, action, onClick, delay,
    ...props 
}) => {
    
    // Polaris Style: Border is consistent regardless of scheme
    const standardBorder = "border-border-light dark:border-border-dark";
    
    const getColors = (scheme: ColorScheme) => {
        const colors: Record<ColorScheme, { bg: string, iconBox: string, watermark: string, badge: string, hoverBorder: string }> = {
            neutral: {
                bg: "bg-surface-light dark:bg-surface-dark",
                iconBox: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                watermark: "text-slate-200 dark:text-slate-700",
                badge: "bg-slate-100 text-slate-600 border-slate-200",
                hoverBorder: "hover:border-slate-300 dark:hover:border-slate-500"
            },
            primary: {
                bg: "bg-surface-light dark:bg-surface-dark",
                iconBox: "bg-primary/10 text-primary",
                watermark: "text-primary",
                badge: "bg-primary/10 text-primary border-primary/20",
                hoverBorder: "hover:border-primary/50"
            },
            success: {
                bg: "bg-surface-light dark:bg-surface-dark",
                iconBox: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
                watermark: "text-emerald-500",
                badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
                hoverBorder: "hover:border-emerald-500/50"
            },
            warning: {
                bg: "bg-surface-light dark:bg-surface-dark",
                iconBox: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
                watermark: "text-amber-500",
                badge: "bg-amber-50 text-amber-700 border-amber-100",
                hoverBorder: "hover:border-amber-500/50"
            },
            danger: {
                bg: "bg-surface-light dark:bg-surface-dark",
                iconBox: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                watermark: "text-red-500",
                badge: "bg-red-50 text-red-700 border-red-100",
                hoverBorder: "hover:border-red-500/50"
            },
            info: {
                bg: "bg-surface-light dark:bg-surface-dark",
                iconBox: "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400",
                watermark: "text-blue-500",
                badge: "bg-blue-50 text-blue-700 border-blue-100",
                hoverBorder: "hover:border-blue-500/50"
            }
        };
        return colors[scheme];
    };

    const colors = getColors(colorScheme as ColorScheme);

    // Apply the soft border to all cards unless explicitly disabled
    const borderClass = noBorder ? '' : `border ${standardBorder}`; 
    const baseClasses = `relative rounded-xl transition-all duration-300 ${borderClass} ${colors.bg} ${className} ${delay ? 'animate-slide-up' : ''}`;
    const isInteractive = variant === 'interactive' || !!onClick;
    const cursorClass = isInteractive ? 'cursor-pointer' : 'cursor-default';
    const interactionClasses = (isInteractive || variant === 'item' || variant === 'metric') 
        ? `group hover:shadow-md ${cursorClass} ${colors.hoverBorder}` 
        : 'shadow-sm';

    // 1. METRIC CARD
    if (variant === 'metric') {
        return (
            <div className={`${baseClasses} ${interactionClasses} ${padding} flex flex-col justify-between overflow-hidden h-full`} style={delay ? { animationDelay: `${delay}ms` } : {}} onClick={onClick} {...props}>
                {icon && (
                    <div className={`absolute right-0 top-0 p-4 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500 pointer-events-none opacity-10 ${colors.watermark}`}>
                        <span className="material-symbols-outlined text-[90px] leading-none select-none">{icon}</span>
                    </div>
                )}
                <div className="flex items-center justify-between z-10 relative">
                    <p className="text-text-secondary dark:text-gray-400 font-medium text-sm">{title}</p>
                    {icon && <div className={`rounded-md p-1.5 flex items-center justify-center ${colors.iconBox}`}><Icon name={icon} size={20} /></div>}
                </div>
                <div className="z-10 relative mt-2">
                    <h3 className="text-2xl font-bold text-text-main dark:text-white tracking-tight">{value}</h3>
                    {subtitle && <div className="mt-1">{typeof subtitle === 'string' ? <p className="text-xs font-medium text-text-secondary dark:text-gray-500">{subtitle}</p> : subtitle}</div>}
                </div>
            </div>
        );
    }

    // 2. ITEM CARD
    if (variant === 'item') {
        return (
            <div className={`${baseClasses} ${interactionClasses} ${padding} flex flex-col gap-3`} onClick={onClick} {...props}>
                <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                        {subtitle && <p className="text-xs font-medium text-text-secondary dark:text-gray-400 uppercase tracking-wide">{subtitle}</p>}
                        {title && <h3 className="text-lg font-bold text-text-main dark:text-white mt-0.5 leading-tight truncate" title={typeof title === 'string' ? title : ''}>{title}</h3>}
                    </div>
                    {badge && <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-bold shrink-0 ${badge.color || colors.badge}`}>{badge.label}</span>}
                </div>
                <div className="flex items-end justify-between mt-auto pt-2">
                    <div>{children}</div>
                    {action && <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>{action}</div>}
                </div>
            </div>
        );
    }

    // 3. STANDARD CARD
    return (
        <div className={`${baseClasses} ${interactionClasses} ${padding}`} onClick={onClick} {...props}>
            {(title || icon || action) && (
                <div className={`flex items-center justify-between mb-4 pb-4 border-b border-border-light dark:border-border-dark`}>
                    <div className="flex items-center gap-3">
                        {icon && <div className={`p-2 rounded-lg ${colors.iconBox}`}><Icon name={icon} size={24} /></div>}
                        <div>
                            {title && <h3 className="text-lg font-bold text-text-main dark:text-white">{title}</h3>}
                            {subtitle && <p className="text-sm text-text-secondary dark:text-gray-400">{subtitle}</p>}
                        </div>
                    </div>
                    {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};
