import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface OrbitalSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Option[];
    error?: string;
}

export const OrbitalSelect: React.FC<OrbitalSelectProps> = ({
    label,
    options,
    error,
    className = '',
    value,
    onChange,
    ...props
}) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
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
            `}>
                <select
                    className={`
                        w-full bg-transparent border-none outline-none appearance-none
                        px-3 py-2 text-sm font-mono text-gray-200
                        cursor-pointer
                        ${className}
                    `}
                    value={value}
                    onChange={onChange}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-orbital-bg text-gray-200">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 pointer-events-none text-gray-500">
                    <ChevronDown size={14} />
                </div>
            </div>
            {error && (
                <span className="text-xs text-orbital-danger font-mono pl-1">{error}</span>
            )}
        </div>
    );
};
