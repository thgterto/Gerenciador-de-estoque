import React, { InputHTMLAttributes, forwardRef, useId } from 'react';

interface OrbitalInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    startAdornment?: React.ReactNode;
    helpText?: string;
    rightIcon?: React.ReactNode;
    leftIcon?: React.ReactNode; // Mapping for icon wrapper
}

export const OrbitalInput = forwardRef<HTMLInputElement, OrbitalInputProps>(({
    label,
    error,
    fullWidth = false,
    startAdornment,
    className = '',
    helpText,
    rightIcon,
    leftIcon,
    ...props
}, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;

    return (
        <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-xs font-display font-bold uppercase tracking-wider text-orbital-subtext pl-1 cursor-pointer"
                >
                    {label}
                </label>
            )}
            <div className="relative group">
                {(startAdornment || leftIcon) && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orbital-subtext group-focus-within:text-orbital-accent transition-colors flex items-center">
                        {startAdornment || leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    ref={ref}
                    className={`
                        w-full bg-orbital-bg/50 border-b border-orbital-border
                        text-orbital-text font-mono text-sm px-3 py-2.5
                        outline-none focus:border-orbital-accent focus:bg-orbital-surface/50
                        focus:shadow-[0_1px_0_0_rgba(6,182,212,0.5)]
                        transition-all duration-200
                        placeholder-orbital-subtext/30
                        ${(startAdornment || leftIcon) ? 'pl-10' : ''}
                        ${rightIcon ? 'pr-10' : ''}
                        ${error ? 'border-orbital-danger text-orbital-danger placeholder-orbital-danger/50' : ''}
                        ${className}
                    `}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orbital-subtext">
                        {rightIcon}
                    </div>
                )}

                {/* Active Indicator Line */}
                <div className="absolute bottom-0 left-0 h-[1px] bg-orbital-accent w-0 group-focus-within:w-full transition-all duration-300" />
            </div>
            {(error || helpText) && (
                <span className={`text-xs pl-1 font-mono ${error ? 'text-orbital-danger' : 'text-orbital-subtext'}`}>
                    {error || helpText}
                </span>
            )}
        </div>
    );
});

OrbitalInput.displayName = 'OrbitalInput';
