import React, { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface OrbitalSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Option[];
    error?: string;
    fullWidth?: boolean;
    helpText?: string;
}

export const OrbitalSelect: React.FC<OrbitalSelectProps> = ({
    label,
    options,
    error,
    fullWidth = false,
    className = '',
    helpText,
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="text-xs font-display font-bold uppercase tracking-wider text-orbital-subtext pl-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                <select
                    className={`
                        w-full bg-orbital-bg/50 border-b border-orbital-border
                        text-orbital-text font-mono text-sm px-3 py-2.5 pr-10
                        appearance-none cursor-pointer
                        outline-none focus:border-orbital-accent focus:bg-orbital-surface/50
                        transition-all duration-200
                        ${error ? 'border-orbital-danger text-orbital-danger' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-orbital-surface text-orbital-text">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-orbital-subtext group-focus-within:text-orbital-accent transition-colors">
                    <ChevronDown size={16} />
                </div>
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
};
