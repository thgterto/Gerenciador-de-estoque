import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface OrbitalBadgeProps {
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
    label: string;
    className?: string;
}

export const OrbitalBadge: React.FC<OrbitalBadgeProps> = ({
    variant = 'neutral',
    label,
    className = ''
}) => {

    const variants = {
        success: "bg-orbital-success/10 text-orbital-success border-orbital-success",
        warning: "bg-orbital-warning/10 text-orbital-warning border-orbital-warning",
        danger: "bg-orbital-danger/10 text-orbital-danger border-orbital-danger",
        info: "bg-orbital-accent/10 text-orbital-accent border-orbital-accent",
        neutral: "bg-orbital-surface text-orbital-subtext border-orbital-border",
        primary: "bg-orbital-accent/20 text-orbital-accent border-orbital-accent"
    };

    // Helper to map string icons to Lucide if needed, or just use generic icons based on variant
    const getIcon = () => {
        if (variant === 'success') return <CheckCircle size={10} />;
        if (variant === 'warning') return <AlertCircle size={10} />;
        if (variant === 'danger') return <XCircle size={10} />;
        if (variant === 'info') return <Info size={10} />;
        // Risk icons mapping could go here if needed
        return null;
    };

    return (
        <span
            className={`
                inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-none
                ${variants[variant]}
                ${className}
            `}
        >
            {getIcon()}
            {label}
        </span>
    );
};
