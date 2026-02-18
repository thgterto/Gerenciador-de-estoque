import React from 'react';

interface OrbitalStatProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    subtitle?: string; // Added subtitle prop to match usage in Dashboard
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'primary' | 'success' | 'warning' | 'danger';
    onClick?: () => void;
}

export const OrbitalStat: React.FC<OrbitalStatProps> = ({
    label,
    value,
    icon,
    subtitle,
    trend,
    trendValue,
    color = 'primary',
    onClick
}) => {
    const colorClasses = {
        primary: 'text-orbital-primary border-orbital-primary bg-orbital-primary/10',
        success: 'text-orbital-success border-orbital-success bg-orbital-success/10',
        warning: 'text-orbital-accent border-orbital-accent bg-orbital-accent/10',
        danger: 'text-orbital-danger border-orbital-danger bg-orbital-danger/10',
    };

    const trendColor = trend === 'up' ? 'text-orbital-success' : trend === 'down' ? 'text-orbital-danger' : 'text-gray-400';

    return (
        <div
            className={`
                group relative p-5
                bg-orbital-card border border-orbital-border
                hover:border-orbital-primary/50 transition-all duration-300
                shadow-orbital rounded-orbital
                flex items-center justify-between
                ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
            `}
            onClick={onClick}
        >
            <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-700/50 pb-1 inline-block">
                    {label}
                </p>
                <div className="flex flex-col">
                    <h4 className="text-3xl font-display font-bold text-gray-100 tracking-tight">
                        {value}
                    </h4>
                    {subtitle && (
                         <span className="text-xs font-mono text-orbital-danger mt-1">
                            {subtitle}
                         </span>
                    )}
                    {trendValue && (
                        <span className={`text-xs font-mono font-bold ${trendColor} mt-1`}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
                        </span>
                    )}
                </div>
            </div>

            {icon && (
                <div className={`
                    p-3 rounded-sm border
                    ${colorClasses[color]}
                    opacity-80 group-hover:opacity-100 transition-opacity
                    flex items-center justify-center
                `}>
                     {/* Try to clone, fallback to raw render if simple node */}
                     {React.isValidElement(icon)
                        ? React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })
                        : icon
                     }
                </div>
            )}

            {/* Tech Decoration */}
            <div className="absolute top-2 right-2 w-1 h-1 bg-gray-600 rounded-full opacity-50" />
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-gray-600 rounded-full opacity-50" />
        </div>
    );
};
