import React from 'react';
import { Icon } from './Icon';
import { Badge } from './Badge';

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
    padding = 'p-6',
    className = '',
    noBorder = false,
    badge, action, onClick, delay,
    ...props
}) => {
    
    // Metric Card Layout
    if (variant === 'metric') {
        const bgClass = 'bg-background'; // Solid background
        const borderClass = 'border-2 border-black dark:border-white'; // Raw border

        return (
            <div
                onClick={onClick}
                className={`${bgClass} ${borderClass} ${padding} relative overflow-hidden transition-all duration-150 hover:-translate-y-1 hover:shadow-md cursor-default ${onClick ? 'cursor-pointer' : ''} ${className}`}
                style={delay ? { animationDelay: `${delay}ms` } : {}}
                {...props}
            >
                <div className="flex justify-between items-start mb-4">
                    {title && <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">{title}</h3>}
                    {icon && (
                        <div className="p-2 bg-text text-background font-bold rounded-none">
                            <Icon name={icon} size={20} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-3xl xl:text-4xl font-bold font-mono text-text-main tracking-tight">
                        {value}
                    </span>
                    {subtitle && (
                        <p className="text-xs font-medium text-text-light uppercase tracking-wide">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Default/Item Layout
    const baseClasses = 'bg-background border-2 border-black dark:border-white transition-all duration-150';
    const hoverClasses = onClick ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer' : '';
    const paddingClasses = padding === 'p-0' ? '' : padding;

    return (
        <div
            onClick={onClick}
            className={`${baseClasses} ${hoverClasses} ${paddingClasses} ${className}`}
            style={delay ? { animationDelay: `${delay}ms` } : {}}
            {...props}
        >
            {(title || subtitle || action || icon || badge) && (
                 <div className="flex items-center justify-between mb-4 border-b-2 border-black/5 dark:border-white/10 pb-3">
                     <div className="flex items-center gap-3 min-w-0">
                         {icon && (
                            <div className="p-2 bg-black text-white dark:bg-white dark:text-black shrink-0">
                                <Icon name={icon} size={20} />
                            </div>
                         )}
                         <div className="flex flex-col min-w-0">
                             {title && <h2 className="text-lg font-bold uppercase leading-none truncate">{title}</h2>}
                             {subtitle && <p className="text-xs text-text-secondary mt-1 font-mono truncate">{subtitle}</p>}
                         </div>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                         {badge && <Badge variant={badge.color as any}>{badge.label}</Badge>}
                         {action && <div>{action}</div>}
                     </div>
                 </div>
            )}
            {children}
        </div>
    );
};
