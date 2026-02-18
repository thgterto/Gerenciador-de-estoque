
import React from 'react';
import { Card } from './Card';

interface MetricCardProps {
    title: string;
    icon: React.ReactNode;
    value: string | number;
    subValue?: string | React.ReactNode;
    variant?: 'primary' | 'warning' | 'danger' | 'success' | 'info' | 'default';
    className?: string;
    delay?: number;
    onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    icon, 
    value, 
    subValue, 
    variant = 'default',
    className = '',
    delay,
    onClick
}) => {
    return (
        <Card
            variant="metric"
            title={title}
            icon={icon as any} // Pass through, Card handles ReactNode in our modified version
            value={value}
            subtitle={subValue}
            colorScheme={variant === 'default' ? 'neutral' : variant}
            className={className}
            delay={delay}
            onClick={onClick}
        />
    );
};
