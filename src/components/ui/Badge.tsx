
import React from 'react';
import { OrbitalBadge } from './orbital/OrbitalBadge';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
    icon?: string;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
    return (
        <OrbitalBadge
            label={String(children)}
            variant={variant}
            className={className}
        />
    );
};
