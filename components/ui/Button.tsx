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
    
    // Base Styles (Soft Modern: Rounded, Medium weight, Smooth transitions)
    const baseStyles = "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.98] rounded-lg shadow-sm";

    // Variants
    const variants = {
        primary: "bg-primary text-white hover:bg-primary-hover hover:shadow-md focus:ring-primary",
        secondary: "bg-secondary text-white hover:bg-secondary-hover hover:shadow-md focus:ring-secondary",

        // Semantic
        success: "bg-success text-white hover:bg-emerald-600 focus:ring-success",
        danger: "bg-danger text-white hover:bg-red-600 focus:ring-danger",
        warning: "bg-warning text-white hover:bg-amber-600 focus:ring-warning",
        info: "bg-info text-white hover:bg-blue-600 focus:ring-info",

        // Outlines & Ghosts
        ghost: "bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-main shadow-none hover:shadow-sm dark:hover:bg-gray-800",
        outline: "bg-transparent text-text-secondary border border-border hover:bg-gray-50 hover:text-text-main hover:border-gray-400 focus:ring-gray-400",
        white: "bg-white text-text-main border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
    };

    // Sizes
    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base"
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
            {!isLoading && icon && <Icon name={icon} className="mr-2" size={size === 'sm' ? 16 : 18} />}
            {children}
        </button>
    );
};
