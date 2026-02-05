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
    
    // Metric Card Layout - Soft Modern
    if (variant === 'metric') {
        return (
            <div
                onClick={onClick}
                className={`bg-surface rounded-xl shadow-sm border border-border-light ${padding} relative transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default ${onClick ? 'cursor-pointer' : ''} ${className}`}
                style={delay ? { animationDelay: `${delay}ms` } : {}}
                {...props}
            >
                <div className="flex justify-between items-start mb-3">
                    {title && <h3 className="text-sm font-semibold text-text-secondary tracking-wide uppercase opacity-90">{title}</h3>}
                    {icon && (
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Icon name={icon} size={20} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold text-text-main tracking-tight font-sans">
                        {value}
                    </span>
                    {subtitle && (
                        <p className="text-xs font-medium text-text-light">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Default/Item Layout - Soft Modern
    const baseClasses = 'bg-surface rounded-xl shadow-sm border border-border-light transition-all duration-300';
    const hoverClasses = onClick ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : '';
    const paddingClasses = padding === 'p-0' ? '' : padding;

    return (
        <div
            onClick={onClick}
            className={`${baseClasses} ${hoverClasses} ${paddingClasses} ${className}`}
            style={delay ? { animationDelay: `${delay}ms` } : {}}
            {...props}
        >
            {(title || subtitle || action || icon || badge) && (
                 <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-4">
                     <div className="flex items-center gap-4">
                         {icon && (
                            <div className="p-2.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                <Icon name={icon} size={20} />
                            </div>
                         )}
                         <div className="flex flex-col">
                             {title && <h2 className="text-lg font-bold text-text-main leading-snug">{title}</h2>}
                             {subtitle && <p className="text-xs text-text-secondary mt-0.5 font-medium">{subtitle}</p>}
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         {badge && <Badge variant={badge.color as any}>{badge.label}</Badge>}
                         {action && <div>{action}</div>}
                     </div>
                 </div>
            )}
            {children}
        </div>
    );
};
