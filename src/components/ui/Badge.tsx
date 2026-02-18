
import React from 'react';
import { OrbitalBadge } from './orbital/OrbitalBadge';
import { Icon } from './Icon';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
    icon?: string;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', icon, className = '' }) => {
    return (
        <OrbitalBadge
            label={String(children)}
            variant={variant}
            className={className}
        />
    );
};
