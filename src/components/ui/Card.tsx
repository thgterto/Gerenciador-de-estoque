
import React from 'react';
import { OrbitalCard } from './orbital/OrbitalCard';
import { OrbitalBadge } from './orbital/OrbitalBadge';
import { Icon } from './Icon';

export type CardVariant = 'default' | 'metric' | 'item' | 'interactive' | 'flat' | 'outlined';
export type ColorScheme = 'neutral' | 'primary' | 'warning' | 'danger' | 'success' | 'info';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string | React.ReactNode;
    value?: string | number;
    icon?: string | React.ReactNode;
    variant?: CardVariant;
    colorScheme?: ColorScheme;
    padding?: string;
    className?: string;
    noBorder?: boolean;
    badge?: { label: string; color?: string; }; // Color ignored in mapping
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
    
    // Helper to render icon whether it's a string name or a ReactNode
    const renderIcon = () => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            return <Icon name={icon} className="text-orbital-accent" />;
        }
        return icon;
    };

    // Metric Card Layout Mapping
    if (variant === 'metric') {
        return (
            <OrbitalCard
                className={`${className} cursor-pointer hover:bg-orbital-accent/5 transition-colors`}
                onClick={onClick}
                {...props}
            >
                <div className="flex justify-between items-start mb-2">
                    {title && <span className="text-xs font-bold text-orbital-subtext uppercase tracking-wider">{title}</span>}
                    {icon && renderIcon()}
                </div>
                <div className="text-3xl font-bold text-orbital-text font-mono">{value}</div>
                {subtitle && <div className="text-xs text-orbital-subtext mt-1">{subtitle}</div>}
            </OrbitalCard>
        );
    }

    // Interactive/Item/Default Mapping
    return (
        <OrbitalCard
            title={title}
            action={action}
            className={`${className} ${onClick ? 'cursor-pointer hover:bg-orbital-accent/5' : ''}`}
            onClick={onClick}
            noPadding={padding === 'p-0'}
            {...props}
        >
            {(subtitle || badge || icon) && (
                <div className="flex items-center gap-2 mb-4 px-1">
                    {icon && renderIcon()}
                    {subtitle && <span className="text-sm text-orbital-subtext">{subtitle}</span>}
                    {badge && <OrbitalBadge label={badge.label} variant={badge.color as any} />}
                </div>
            )}
            {children}
        </OrbitalCard>
    );
};
