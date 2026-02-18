import React, { ButtonHTMLAttributes } from 'react';
import { Button as MuiButton, CircularProgress, SxProps, Theme } from '@mui/material';
import { Icon } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline' | 'outlined' | 'white' | 'warning' | 'info' | 'contained' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'color'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: string;
    isLoading?: boolean;
    fullWidth?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    sx?: SxProps<Theme>;
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
    sx,
    ...props 
}) => {
    
    let color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit' = 'primary';
    let muiVariant: 'contained' | 'outlined' | 'text' = 'contained';

    switch (variant) {
        case 'primary': color = 'primary'; break;
        case 'contained': color = 'primary'; break;
        case 'secondary': color = 'secondary'; break;
        case 'success': color = 'success'; break;
        case 'danger': color = 'error'; break;
        case 'warning': color = 'warning'; break;
        case 'info': color = 'info'; break;
        case 'ghost': muiVariant = 'text'; color = 'inherit'; break;
        case 'text': muiVariant = 'text'; color = 'inherit'; break;
        case 'outline': muiVariant = 'outlined'; color = 'inherit'; break;
        case 'outlined': muiVariant = 'outlined'; color = 'inherit'; break;
        case 'white': muiVariant = 'outlined'; color = 'inherit'; break;
    }

    const muiSize = size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'medium';

    return (
        <MuiButton
            variant={muiVariant}
            color={color}
            size={muiSize}
            fullWidth={fullWidth}
            disabled={disabled || isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : (startIcon || (icon ? <Icon name={icon} /> : null))}
            endIcon={endIcon}
            className={className}
            sx={sx}
            {...(props as any)}
        >
            {children}
        </MuiButton>
    );
};
