
import React, { InputHTMLAttributes, forwardRef } from 'react';
import { TextField, Icon } from '@shopify/polaris';
import { getIcon } from '../../utils/iconMapper';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    label?: string;
    icon?: string;
    error?: string;
    isLoading?: boolean;
    containerClassName?: string;
    rightElement?: React.ReactNode;
    helpText?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    id,
    onChange,
    value,
    type,
    ...props 
}, ref) => {

    // Adapt onChange
    const handleChange = (newValue: string) => {
        if (onChange) {
            // Mock event object for compatibility with existing code
            const event = {
                target: { value: newValue, name: props.name || '', type: type || 'text' },
                currentTarget: { value: newValue, name: props.name || '', type: type || 'text' },
                preventDefault: () => {},
                stopPropagation: () => {}
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            onChange(event);
        }
    };

    // Prefix icon handling
    const polarisIcon = getIcon(icon);
    const prefix = polarisIcon ? <Icon source={polarisIcon} /> : (icon ? <span className="material-symbols-outlined text-[20px]">{icon}</span> : null);

    // Suffix handling
    const suffix = isLoading ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : rightElement;

    return (
        <div className={containerClassName}>
            <TextField
                label={label || ''}
                value={value}
                onChange={handleChange}
                error={error}
                helpText={helpText}
                prefix={prefix}
                suffix={suffix}
                type={type as any}
                disabled={props.disabled}
                placeholder={props.placeholder}
                name={props.name}
                id={id}
                autoComplete={props.autoComplete}
                readOnly={props.readOnly}
            />
        </div>
    );
});

Input.displayName = 'Input';
