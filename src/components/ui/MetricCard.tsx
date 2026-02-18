
import React from 'react';
import { Card } from './Card';

interface MetricCardProps {
    title: string;
    icon: string;
    value: string | number;
    subValue?: string | React.ReactNode;
    variant?: 'primary' | 'warning' | 'danger' | 'success' | 'info' | 'default';
    className?: string;
    delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    icon, 
    value, 
    subValue, 
    variant = 'default',
    className = '',
    delay
}) => {
    return (
        <Card
            variant="metric"
            title={title}
            icon={icon}
            value={value}
            subtitle={subValue}
            colorScheme={variant === 'default' ? 'neutral' : variant}
            className={className}
            delay={delay}
        />
    );
};
