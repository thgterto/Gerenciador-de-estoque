import React, { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline' | 'white' | 'warning' | 'info';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
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
    
    // Base Styles (Maestro: Raw, Bold, Uppercase)
    const baseStyles = "inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all duration-100 ease-out focus:outline-none border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-none";

    // Variants
    const variants = {
        primary: "bg-primary text-black border-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]",
        secondary: "bg-transparent text-text border-text hover:bg-text hover:text-background hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]",
        success: "bg-success text-white border-success-text hover:bg-success-text hover:text-white hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        danger: "bg-danger text-white border-black hover:bg-red-900 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        warning: "bg-warning text-black border-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        info: "bg-info text-white border-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        ghost: "bg-transparent text-text border-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
        outline: "bg-transparent text-text border-border hover:border-text hover:bg-gray-50",
        white: "bg-white text-black border-gray-200 hover:border-black hover:shadow-sm"
    };

    // Sizes
    const sizes = {
        sm: "h-8 px-3 text-[10px]",
        md: "h-10 px-4 text-xs",
        lg: "h-12 px-6 text-sm"
    };

    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size];
    const widthStyles = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyles} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {!isLoading && icon && <Icon name={icon} className="mr-2" size={size === 'sm' ? 14 : 18} />}
            {children}
        </button>
    );
};
