
import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline' | 'white' | 'warning' | 'info';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: string;
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    icon, 
    isLoading, 
    className = '', 
    disabled,
    fullWidth = false,
    ...props 
}) => {
    // Base Styles - Updated border radius to rounded-lg per Stitch design
    const baseStyles = `
        relative inline-flex items-center justify-center 
        font-semibold transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none 
        active:scale-[0.98] select-none whitespace-nowrap rounded-lg
        ${fullWidth ? 'w-full' : ''}
    `;
    
    // Variantes
    const variants = {
        primary: `
            bg-primary text-white border border-transparent 
            hover:bg-primary-hover 
            shadow-sm hover:shadow-md
            focus:ring-primary dark:focus:ring-offset-gray-900
        `,
        secondary: `
            bg-secondary text-white border border-transparent 
            hover:bg-secondary-hover 
            shadow-sm 
            focus:ring-secondary dark:focus:ring-offset-gray-900
        `,
        success: `
            bg-success text-white border border-transparent 
            hover:bg-emerald-700 
            shadow-sm 
            focus:ring-success
        `,
        danger: `
            bg-danger text-white border border-transparent 
            hover:bg-red-700 
            shadow-sm 
            focus:ring-danger
        `,
        warning: `
            bg-warning text-white border border-transparent 
            hover:bg-amber-600 
            shadow-sm 
            focus:ring-warning
        `,
        info: `
            bg-info text-white border border-transparent 
            hover:bg-blue-700 
            shadow-sm 
            focus:ring-info
        `,
        white: `
            bg-white dark:bg-surface-dark 
            text-text-main dark:text-white 
            border border-border-light dark:border-border-dark 
            hover:bg-slate-50 dark:hover:bg-slate-800 
            shadow-sm hover:shadow 
            focus:ring-slate-200 dark:focus:ring-slate-600
        `,
        outline: `
            bg-transparent 
            text-primary 
            border border-primary/30 
            hover:bg-primary/5 
            focus:ring-primary
        `,
        ghost: `
            bg-transparent 
            text-text-secondary dark:text-slate-400 
            hover:bg-slate-100 dark:hover:bg-slate-800 
            hover:text-text-main dark:hover:text-white 
            border border-transparent 
            focus:ring-slate-200 dark:focus:ring-slate-700 focus:ring-offset-0
        `
    };

    const sizes = {
        sm: "h-8 px-3 text-xs gap-1.5", // Slightly taller for better touch targets
        md: "h-10 px-4 text-sm gap-2", 
        lg: "h-12 px-6 text-base gap-2.5"
    };

    return (
        <button 
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                         <span className="block size-4 border-2 border-current border-r-transparent rounded-full animate-spin"></span>
                    </span>
                    <span className="opacity-0 flex items-center gap-2">
                         {icon && <span className="material-symbols-outlined text-[1.2em]">{icon}</span>}
                         {children}
                    </span>
                </>
            ) : (
                <>
                    {icon && (
                        <span className="material-symbols-outlined text-[1.2em] leading-none shrink-0">
                            {icon}
                        </span>
                    )}
                    {children}
                </>
            )}
        </button>
    );
};
