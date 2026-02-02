
import React from 'react';
import { Badge as PolarisBadge } from '@shopify/polaris';
import { getIcon } from '../../utils/iconMapper';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    icon?: string;
    className?: string;
    withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', icon, className = '', withDot = false }) => {

    let tone: 'success' | 'warning' | 'critical' | 'info' | 'new' | undefined;
    let progress: 'complete' | 'partiallyComplete' | 'incomplete' | undefined;

    switch (variant) {
        case 'success': tone = 'success'; break;
        case 'warning': tone = 'warning'; break;
        case 'danger': tone = 'critical'; break;
        case 'info': tone = 'info'; break;
        case 'primary': tone = 'new'; break;
        case 'neutral': tone = undefined; break;
    }

    if (withDot) {
        progress = 'complete';
    }

    const polarisIcon = getIcon(icon);
    // Polaris Badge 'icon' prop expects IconSource.
    // If we have a string icon not in map, we pass a component.
    const iconSource = polarisIcon || (icon ? () => <span className="material-symbols-outlined text-[14px]">{icon}</span> : undefined);

    return (
        <span className={className}>
            <PolarisBadge tone={tone} progress={progress} icon={iconSource}>
                {children}
            </PolarisBadge>
        </span>
    );
};
