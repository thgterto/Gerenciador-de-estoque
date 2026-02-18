import React from 'react';

// Main Table Container
export const OrbitalTable = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    return (
        <div className={`w-full overflow-hidden border border-orbital-border bg-orbital-surface ${className}`}>
            <table className="w-full text-left border-collapse">
                {children}
            </table>
        </div>
    );
};

// Table Header
export const OrbitalHead = ({ children }: { children: React.ReactNode }) => {
    return (
        <thead className="bg-orbital-bg border-b border-orbital-border text-xs font-display font-bold uppercase tracking-wider text-orbital-subtext">
            {children}
        </thead>
    );
};

// Table Body
export const OrbitalBody = ({ children }: { children: React.ReactNode }) => {
    return (
        <tbody className="divide-y divide-orbital-border/50">
            {children}
        </tbody>
    );
};

// Table Row
interface OrbitalRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    children: React.ReactNode;
    isHoverable?: boolean;
    isSelected?: boolean;
}

export const OrbitalRow: React.FC<OrbitalRowProps> = ({ children, isHoverable = true, isSelected, className = '', ...props }) => {
    return (
        <tr
            className={`
                group transition-colors duration-200
                ${isHoverable ? 'hover:bg-orbital-accent/5' : ''}
                ${isSelected ? 'bg-orbital-accent/10' : 'bg-transparent'}
                ${className}
            `}
            {...props}
        >
            {children}
        </tr>
    );
};

// Table Header Cell
export const OrbitalTh = ({ children, className = '', align = 'left' }: { children: React.ReactNode; className?: string, align?: 'left'|'center'|'right' }) => {
    return (
        <th className={`px-4 py-3 font-medium text-${align} ${className}`}>
            {children}
        </th>
    );
};

// Table Cell
export const OrbitalTd = ({ children, className = '', align = 'left' }: { children: React.ReactNode; className?: string, align?: 'left'|'center'|'right' }) => {
    return (
        <td className={`px-4 py-3 text-sm text-orbital-text text-${align} font-mono ${className}`}>
            {children}
        </td>
    );
};
