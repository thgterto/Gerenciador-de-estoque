
import React, { ButtonHTMLAttributes } from 'react';
import { Button as PolarisButton, Icon } from '@shopify/polaris';
import { getIcon } from '../../utils/iconMapper';

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
    onClick,
    type,
    ...props 
}) => {
    
    let polarisVariant: 'primary' | 'plain' | 'monochromePlain' | 'tertiary' | undefined;
    let polarisTone: 'critical' | 'success' | undefined; // Polaris supports 'critical' and 'success' (in some versions)

    // Mapping variants
    switch (variant) {
        case 'primary':
            polarisVariant = 'primary';
            break;
        case 'secondary':
        case 'outline':
        case 'white':
            // Default button style (secondary/outline)
            break;
        case 'ghost':
            polarisVariant = 'plain';
            break;
        case 'danger':
            polarisTone = 'critical';
            // If original was solid red, we might want variant='primary' tone='critical'
            // But usually danger buttons are primary critical.
            polarisVariant = 'primary';
            break;
        case 'success':
            // Polaris doesn't support 'success' tone on buttons officially in all versions,
            // but let's try or fallback to primary with custom class if needed.
            // For now, map to primary.
            polarisVariant = 'primary';
            // tone='success' might work if supported, otherwise it ignores it.
            polarisTone = 'success';
            break;
        case 'warning':
        case 'info':
            // No direct mapping, fallback to secondary or primary
            break;
    }

    // Mapping sizes
    const sizeMap: Record<ButtonSize, 'slim' | 'medium' | 'large'> = {
        sm: 'slim',
        md: 'medium',
        lg: 'large'
    };

    // Handling Icon
    const polarisIcon = getIcon(icon);

    // Fallback for custom icon string if not in mapper (rendering as children is not ideal for 'icon' prop)
    // If icon is provided but not found in map, and it's a string, we might display it as text or try to find a material icon match?
    // The previous implementation used material-symbols-outlined class.
    // Polaris Button 'icon' prop expects a component.
    // If we can't find it, we pass it as a component that renders the span.

    const iconSource = polarisIcon || (icon ? () => <span className="material-symbols-outlined">{icon}</span> : undefined);

    return (
        <div className={className} style={{ display: fullWidth ? 'block' : 'inline-block' }}>
            <PolarisButton
                variant={polarisVariant}
                tone={polarisTone}
                size={sizeMap[size]}
                loading={isLoading}
                fullWidth={fullWidth}
                disabled={disabled}
                onClick={onClick}
                submit={type === 'submit'}
                icon={iconSource}
                {...props as any} // Pass remaining props
            >
                {children}
            </PolarisButton>
        </div>
    );
};
