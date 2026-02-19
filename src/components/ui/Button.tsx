
import React from 'react';
import { OrbitalButton } from './orbital/OrbitalButton';
import { Icon } from './Icon';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline' | 'outlined' | 'white' | 'warning' | 'info' | 'contained' | 'text';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    isLoading?: boolean;
    fullWidth?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
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
    startIcon,
    endIcon,
    ...props 
}) => {
    
    // Map legacy variants to Orbital variants
    let orbitalVariant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' = 'primary';

    if (variant === 'secondary' || variant === 'info') orbitalVariant = 'secondary';
    if (variant === 'danger' || variant === 'warning') orbitalVariant = 'danger';
    if (variant === 'ghost' || variant === 'text') orbitalVariant = 'ghost';
    if (variant === 'outline' || variant === 'outlined' || variant === 'white') orbitalVariant = 'outline';
    if (variant === 'success') orbitalVariant = 'primary'; // Map success to primary (cyan) for now, or add success to OrbitalButton

    return (
        <OrbitalButton
            variant={orbitalVariant}
            size={size}
            isLoading={isLoading}
            disabled={disabled}
            fullWidth={fullWidth}
            className={className}
            {...props}
        >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : (startIcon || (icon ? <Icon name={icon} className="mr-2" /> : null))}
            {children}
            {endIcon}
        </OrbitalButton>
    );
};
