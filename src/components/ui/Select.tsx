
import React from 'react';
import { OrbitalSelect } from './orbital/OrbitalSelect';

interface SelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    icon?: string;
    error?: string;
    options?: SelectOption[];
    containerClassName?: string;
    helpText?: string;
}

export const Select: React.FC<SelectProps> = ({ 
    label, 
    error, 
    options = [], 
    containerClassName = '',
    helpText,
    ...props 
}) => {

    return (
        <div className={containerClassName}>
            <OrbitalSelect
                label={label}
                error={error}
                options={options}
                helpText={helpText}
                {...props}
            />
        </div>
    );
};
