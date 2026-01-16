
import React from 'react';
import { ItemStatusResult } from '../../utils/businessRules';
import { Badge } from './Badge';

interface StatusBadgeProps {
    status: ItemStatusResult;
    className?: string;
    showIcon?: boolean;
    compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
    status, 
    className = '', 
    showIcon = true,
    compact = false
}) => {
    
    // Mapeamento direto do statusResult para variantes do Badge
    const variantMap: Record<string, 'success' | 'warning' | 'danger'> = {
        'success': 'success',
        'warning': 'warning',
        'danger': 'danger'
    };

    return (
        <Badge 
            variant={variantMap[status.variant] || 'neutral'}
            icon={showIcon ? status.icon : undefined}
            className={`font-bold ${compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'} ${className}`}
        >
            {status.label}
        </Badge>
    );
};
