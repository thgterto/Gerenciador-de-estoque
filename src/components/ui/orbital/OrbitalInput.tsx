import React from 'react';

interface OrbitalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    error?: string;
    fullWidth?: boolean;
}

export const OrbitalInput: React.FC<OrbitalInputProps> = ({
    label,
    startIcon,
    endIcon,
    error,
    fullWidth = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 pl-1">
                    {label}
                </label>
            )}
            <div className={`
                relative flex items-center
                bg-orbital-card border border-orbital-border rounded-sm
                focus-within:border-orbital-primary/50 focus-within:shadow-[0_0_10px_rgba(34,211,238,0.1)]
                transition-all duration-200
                ${error ? 'border-orbital-danger/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : ''}
            `}>
                {startIcon && (
                    <div className="pl-3 text-gray-500">
                        {startIcon}
                    </div>
                )}
                <input
                    className={`
                        w-full bg-transparent border-none outline-none
                        px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${className}
                    `}
                    {...props}
                />
                {endIcon && (
                    <div className="pr-3 text-gray-500">
                        {endIcon}
                    </div>
                )}
            </div>
            {error && (
                <span className="text-xs text-orbital-danger font-mono pl-1">{error}</span>
            )}
        </div>
    );
};
