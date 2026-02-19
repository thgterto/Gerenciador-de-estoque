
import React, { forwardRef } from 'react';
import { OrbitalInput } from './orbital/OrbitalInput';
import { Loader2 } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: string;
    error?: string;
    isLoading?: boolean;
    containerClassName?: string;
    rightElement?: React.ReactNode;
    helpText?: string;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ 
    label, 
    icon, 
    error, 
    isLoading,
    className = '', 
    containerClassName = '',
    rightElement,
    helpText,
    fullWidth,
    ...props 
}, ref) => {

    return (
        <div className={containerClassName}>
            <OrbitalInput
                ref={ref}
                label={label}
                error={error}
                className={className}
                leftIcon={icon ? <span className="material-symbols-outlined text-[20px]">{icon}</span> : undefined}
                rightIcon={isLoading ? <Loader2 className="animate-spin" size={16} /> : rightElement}
                helpText={helpText}
                {...props}
            />
        </div>
    );
});

Input.displayName = 'Input';
