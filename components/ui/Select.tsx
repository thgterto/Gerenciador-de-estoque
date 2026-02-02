
import React, { SelectHTMLAttributes } from 'react';
import { Select as PolarisSelect } from '@shopify/polaris';

interface SelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
    label?: string;
    icon?: string; // Ignored in Polaris unless we customize
    error?: string;
    options?: SelectOption[];
    containerClassName?: string;
    helpText?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children?: React.ReactNode; // For backward compatibility if we parse it, but better to enforce options
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

    // Attempt to extract options from children if options is empty
    let finalOptions: SelectOption[] = options;

    if (!finalOptions.length && children) {
        // This is a best-effort extraction. Complex structures might fail.
        // It's recommended to migrate to 'options' prop.
        const extractOptions = (nodes: React.ReactNode): SelectOption[] => {
            const opts: SelectOption[] = [];
            React.Children.forEach(nodes, (child) => {
                if (!React.isValidElement(child)) return;

                if ((child as any).type === 'option') {
                    const { value, children: label, disabled } = ((child as any).props || {}) as any;
                    opts.push({ label: String(label), value: String(value), disabled });
                } else if ((child as any).type === React.Fragment) {
                     opts.push(...extractOptions((child as any).props.children));
                } else if (Array.isArray(child)) {
                     opts.push(...extractOptions(child));
                }
                // Handle mapped arrays which might appear as arrays in children
            });
            return opts;
        };
        // React.Children.map flattens arrays, so we can iterate
        React.Children.forEach(children, (child) => {
             if (!React.isValidElement(child)) return;
             if ((child as any).type === 'option') {
                 const { value, children: label, disabled } = ((child as any).props || {}) as any;
                 finalOptions.push({ label: String(label), value: String(value), disabled });
             } else if ((child as any).type === React.Fragment) {
                 // handle fragment if needed
             }
        });

        // If extraction failed or was incomplete due to Fragments/Arrays not being fully traversed by forEach in some cases,
        // we might just rely on 'options' being passed.
        // Given the task is to "eliminate adaptation failure", maybe we should try to support children better
        // OR just refactor the usages. I will refactor usages.
        // But I'll leave the prop in interface to avoid type errors before I fix usages.
    }

    const handleChange = (newValue: string) => {
        if (onChange) {
            const event = {
                target: { value: newValue, name: props.name || '' },
                currentTarget: { value: newValue, name: props.name || '' }
            } as unknown as React.ChangeEvent<HTMLSelectElement>;
            onChange(event);
        }
    };

    return (
        <div className={containerClassName}>
            <PolarisSelect
                label={label || ''}
                options={finalOptions}
                onChange={handleChange}
                value={value}
                error={error}
                helpText={helpText}
                id={id}
                disabled={props.disabled}
            />
        </div>
    );
};
