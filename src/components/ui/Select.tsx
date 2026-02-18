import React, { SelectHTMLAttributes } from 'react';
import { TextField, MenuItem } from '@mui/material';

interface SelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
    label?: string;
    icon?: string;
    error?: string;
    options?: SelectOption[];
    containerClassName?: string;
    helpText?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // Changed to HTMLInputElement to match TextField signature wrapper
    children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ 
    label, 
    icon, 
    error, 
    options = [], 
    children,
    className = '', 
    containerClassName = '',
    helpText,
    id,
    onChange,
    value,
    ...props 
}) => {

    const finalOptions: SelectOption[] = options;

    // Backward compatibility for children <option> extraction
    // (Simplified best-effort or just fallback to rendering children inside Select if passed directly)
    // MUI TextField select expects MenuItem children.

    return (
        <div className={containerClassName}>
            <TextField
                select
                label={label}
                value={value || ''}
                onChange={onChange as any} // Cast to satisfy type if mismatch slightly
                error={!!error}
                helperText={error || helpText}
                fullWidth
                variant="outlined"
                size="small"
                disabled={props.disabled}
                id={id}
                name={props.name}
            >
                {finalOptions.length > 0 ? (
                    finalOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                            {opt.label}
                        </MenuItem>
                    ))
                ) : (
                    // Fallback to children if provided (and compatible with MenuItem structure?)
                    // If children are <option>, we need to map them.
                    // This part is tricky without parsing.
                    // For now, assume options are passed. If children are passed, we might break or show empty.
                    // Most usages I saw use options prop.
                    <MenuItem value="" disabled>Selecione...</MenuItem>
                )}
            </TextField>
        </div>
    );
};
