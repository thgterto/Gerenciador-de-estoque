import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: string;
    error?: string;
    isLoading?: boolean;
    containerClassName?: string;
    rightElement?: React.ReactNode;
    helpText?: string;
}

export const Input: React.FC<InputProps> = ({ 
    label, 
    icon, 
    error, 
    isLoading,
    className = '', 
    containerClassName = '',
    rightElement,
    helpText,
    id,
    ...props 
}) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && (
                <label htmlFor={inputId} className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    {label} {props.required && <span className="text-red-600">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
                        w-full rounded-lg border text-sm transition-shadow duration-200
                        placeholder:text-slate-400 dark:placeholder:text-slate-500
                        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                        bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                        h-10 
                        ${icon ? 'pl-10' : 'pl-3'} 
                        ${!className.includes('pr-') ? (rightElement || isLoading ? 'pr-10' : 'pr-3') : ''}
                        ${error 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }
                        ${className}
                    `}
                    {...props}
                />
                {(isLoading || rightElement) && (
                    <div className={`absolute inset-y-0 right-0 pr-3 flex items-center gap-1 ${isLoading ? 'pointer-events-none' : ''}`}>
                        {isLoading ? (
                            <span className="material-symbols-outlined animate-spin text-primary text-[20px]">progress_activity</span>
                        ) : (
                            rightElement
                        )}
                    </div>
                )}
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