import React from 'react';

interface OrbitalBadgeProps {
    label: string;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
    size?: 'sm' | 'md';
}

export const OrbitalBadge: React.FC<OrbitalBadgeProps> = ({
    label,
    color = 'default',
    size = 'sm'
}) => {
    const colors = {
        default: 'border-gray-600 text-gray-400 bg-gray-800',
        primary: 'border-orbital-primary text-orbital-primary bg-orbital-primary/10',
        secondary: 'border-gray-500 text-gray-300 bg-gray-700',
        success: 'border-orbital-success text-orbital-success bg-orbital-success/10',
        warning: 'border-orbital-accent text-orbital-accent bg-orbital-accent/10',
        danger: 'border-orbital-danger text-orbital-danger bg-orbital-danger/10',
    };

    const sizes = {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-3 py-1',
    };

    return (
        <span className={`
            font-mono uppercase tracking-wider font-bold
            border rounded-sm
            whitespace-nowrap
            ${colors[color]}
            ${sizes[size]}
        `}>
            {label}
        </span>
    );
};
