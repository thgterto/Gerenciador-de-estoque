import React, { InputHTMLAttributes, forwardRef } from 'react';
import { TextField, InputAdornment, CircularProgress } from '@mui/material';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size' | 'color'> {
    label?: string;
    icon?: string;
    error?: string;
    isLoading?: boolean;
    containerClassName?: string;
    rightElement?: React.ReactNode;
    helpText?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputProps?: any;
    InputLabelProps?: any;
    size?: 'small' | 'medium';
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
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
    inputProps,
    InputLabelProps,
    size = 'small',
    color,
    ...props 
}, ref) => {

    const startAdornment = icon ? (
        <InputAdornment position="start">
            <span className="material-symbols-outlined text-[20px] text-gray-500">{icon}</span>
        </InputAdornment>
    ) : null;

    const endAdornment = isLoading ? (
        <InputAdornment position="end">
            <CircularProgress size={20} />
        </InputAdornment>
    ) : rightElement ? (
        <InputAdornment position="end">
            {rightElement}
        </InputAdornment>
    ) : null;

    return (
        <div className={containerClassName}>
            <TextField
                inputRef={ref}
                label={label}
                value={value || ''}
                onChange={onChange}
                error={!!error}
                helperText={error || helpText}
                fullWidth
                type={type}
                disabled={props.disabled}
                placeholder={props.placeholder}
                name={props.name}
                id={id}
                autoComplete={props.autoComplete}
                InputProps={{
                    startAdornment,
                    endAdornment,
                    ...inputProps
                }}
                InputLabelProps={InputLabelProps}
                variant="outlined"
                size={size}
                color={color}
                {...props}
            />
        </div>
    );
});

Input.displayName = 'Input';
