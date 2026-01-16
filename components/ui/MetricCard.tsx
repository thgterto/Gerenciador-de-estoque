
import React from 'react';
import { Card, ColorScheme } from './Card';

interface MetricCardProps {
    title: string;
    icon: string;
    value: string | number;
    subValue?: string | React.ReactNode;
    variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success' | 'info';
    className?: string;
    delay?: number;
    backgroundIcon?: string; // Legacy prop, mapped to icon in new system
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
    // Map legacy variants to new ColorScheme
    const colorMap: Record<string, ColorScheme> = {
        'default': 'neutral',
        'primary': 'primary',
        'warning': 'warning',
        'danger': 'danger',
        'success': 'success',
        'info': 'info'
    };

    return (
        <Card 
            variant="metric"
            colorScheme={colorMap[variant] || 'neutral'}
            title={title}
            icon={icon}
            value={value}
            subtitle={subValue}
            className={className}
            delay={delay}
        />
    );
};
