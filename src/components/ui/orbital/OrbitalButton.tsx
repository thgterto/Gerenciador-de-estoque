import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface OrbitalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const OrbitalButton: React.FC<OrbitalButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    icon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "relative inline-flex items-center justify-center font-display font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-orbital-accent text-orbital-bg border border-orbital-accent hover:bg-orbital-hover hover:border-orbital-hover shadow-glow-sm",
        outline: "bg-transparent text-orbital-accent border border-orbital-accent hover:bg-orbital-accent/10 hover:shadow-glow-sm",
        ghost: "bg-transparent text-orbital-subtext hover:text-orbital-text hover:bg-orbital-surface border border-transparent",
        danger: "bg-transparent text-orbital-danger border border-orbital-danger hover:bg-orbital-danger/10 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && icon && <span className="mr-2">{icon}</span>}
            {children}

            {/* Tech Corner Accent for Primary/Outline */}
            {(variant === 'primary' || variant === 'outline') && (
                <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 bg-orbital-bg border-t border-l border-current opacity-50" />
            )}
        </button>
    );
};
