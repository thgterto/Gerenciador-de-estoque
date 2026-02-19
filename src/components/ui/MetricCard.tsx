
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
            icon={icon as any} // Card expects string icon name but we updated OrbitalCard to handle ReactNode if we modify wrapper or pass children.
            // Actually `Card` wrapper expects `icon` as string if using `Icon` component internally, OR we need to update `Card` to accept `ReactNode`.
            // Let's check `src/components/ui/Card.tsx` again.
            value={value}
            subtitle={subValue as any} // Card expects string | ReactNode?
            colorScheme={variant === 'default' ? 'neutral' : variant}
            className={className}
            delay={delay}
            onClick={onClick}
        />
    );
};
