import React from 'react';
import { Chip } from '@mui/material';
import { Icon } from './Icon';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    icon?: string;
    className?: string;
    withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', icon, className = '' }) => {

    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';

    switch (variant) {
        case 'success': color = 'success'; break;
        case 'warning': color = 'warning'; break;
        case 'danger': color = 'error'; break;
        case 'info': color = 'info'; break;
        case 'primary': color = 'primary'; break;
        case 'neutral': color = 'default'; break;
    }

    return (
        <Chip
            label={children}
            color={color}
            size="small"
            icon={icon ? <Icon name={icon} size={14} /> : undefined}
            variant={variant === 'neutral' ? 'outlined' : 'filled'}
            className={className}
            sx={{ fontWeight: 'bold' }}
        />
    );
};
