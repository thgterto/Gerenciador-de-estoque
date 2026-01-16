
import React, { SelectHTMLAttributes } from 'react';

interface SelectOption {
    label: string;
    value: string | number;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    icon?: string;
    error?: string;
    options?: SelectOption[];
    containerClassName?: string;
    helpText?: string;
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
    ...props 
}) => {
    const selectId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && (
                <label htmlFor={selectId} className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    {label} {props.required && <span className="text-red-600">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                )}
                <select
                    id={selectId}
                    className={`
                        w-full rounded-lg border text-sm transition-shadow duration-200 appearance-none cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                        bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                        h-10
                        ${icon ? 'pl-10' : 'pl-3'} pr-10
                        ${error 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }
                        ${className}
                    `}
                    {...props}
                >
                    {children ? children : options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                    <span className="material-symbols-outlined text-[20px]">unfold_more</span>
                </div>
            </div>
            {helpText && !error && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{helpText}</p>
            )}
            {error && (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1 animate-fade-in">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {error}
                </p>
            )}
        </div>
    );
};
