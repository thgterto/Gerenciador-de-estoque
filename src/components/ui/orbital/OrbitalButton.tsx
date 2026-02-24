import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface OrbitalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'secondary' | 'success' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const OrbitalButton: React.FC<OrbitalButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    icon,
    className = '',
    disabled,
    fullWidth = false,
    ...props
}) => {
    const baseStyles = "relative inline-flex items-center justify-center font-display font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-orbital-accent text-orbital-bg border border-orbital-accent hover:bg-orbital-hover hover:border-orbital-hover shadow-sm",
        outline: "bg-transparent text-orbital-accent border border-orbital-accent hover:bg-orbital-accent/10 hover:shadow-sm",
        ghost: "bg-transparent text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface border border-transparent",
        danger: "bg-transparent text-orbital-danger border border-orbital-danger hover:bg-orbital-danger/10 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]",
        secondary: "bg-transparent text-orbital-subtext border border-orbital-subtext hover:text-orbital-text hover:border-orbital-text hover:bg-orbital-subtext/10",
        success: "bg-orbital-success/10 text-orbital-success border border-orbital-success hover:bg-orbital-success/20",
        warning: "bg-orbital-warning/10 text-orbital-warning border border-orbital-warning hover:bg-orbital-warning/20",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && icon && <span className="mr-2 flex items-center">{icon}</span>}
            {children}

        </button>
    );
};
