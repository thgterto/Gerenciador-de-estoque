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
    // Base Styles - Polaris/System Consistent
    const baseStyles = `
        relative inline-flex items-center justify-center 
        font-semibold transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none 
        active:scale-[0.98] select-none whitespace-nowrap rounded-lg
        ${fullWidth ? 'w-full' : ''}
    `;
    
    const variants = {
        // Primary: Brand Color (#903A40) - High Emphasis
        primary: `
            bg-[#903A40] text-white border border-transparent 
            hover:bg-[#732e33] 
            shadow-[0_1px_0_rgba(0,0,0,0.05)] shadow-sm 
            focus:ring-[#903A40] dark:focus:ring-offset-gray-900
        `,
        
        // Secondary: Brand Accent (#6797A1)
        secondary: `
            bg-[#6797A1] text-white border border-transparent 
            hover:bg-[#547D85] 
            shadow-[0_1px_0_rgba(0,0,0,0.05)] shadow-sm 
            focus:ring-[#6797A1] dark:focus:ring-offset-gray-900
        `,
        
        // Success: Green
        success: `
            bg-emerald-600 text-white border border-transparent 
            hover:bg-emerald-700 
            shadow-sm 
            focus:ring-emerald-500
        `,
        
        // Danger: Red
        danger: `
            bg-red-600 text-white border border-transparent 
            hover:bg-red-700 
            shadow-sm 
            focus:ring-red-500
        `,
        
        // Warning: Amber
        warning: `
            bg-amber-500 text-white border border-transparent 
            hover:bg-amber-600 
            shadow-sm 
            focus:ring-amber-500
        `,

        // Info: Blue
        info: `
            bg-blue-600 text-white border border-transparent 
            hover:bg-blue-700 
            shadow-sm 
            focus:ring-blue-500
        `,
        
        // White/Surface: Standard Secondary Action (Polaris style)
        white: `
            bg-white dark:bg-surface-dark 
            text-text-main dark:text-white 
            border border-border-light dark:border-border-dark 
            hover:bg-slate-50 dark:hover:bg-slate-700 
            shadow-sm 
            focus:ring-slate-200 dark:focus:ring-slate-600
        `,
        
        // Outline: Primary colored border
        outline: `
            bg-transparent 
            text-primary 
            border border-primary/30 
            hover:bg-primary/5 
            focus:ring-primary
        `,
        
        // Ghost: Low emphasis, no border
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
        sm: "h-7 px-3 text-xs gap-1.5", // Compact
        md: "h-9 px-4 text-sm gap-2",   // Standard (36px)
        lg: "h-11 px-6 text-base gap-2.5" // Large (44px)
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