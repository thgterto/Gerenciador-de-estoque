import React from 'react';

interface OrbitalCardProps {
    children: React.ReactNode;
    title?: string;
    action?: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export const OrbitalCard: React.FC<OrbitalCardProps> = ({
    children,
    title,
    action,
    className = '',
    noPadding = false
}) => {
    return (
        <div className={`
            relative flex flex-col
            bg-orbital-card text-gray-100
            border border-orbital-border
            shadow-orbital rounded-orbital
            overflow-hidden
            group
            transition-all duration-300
            hover:shadow-orbital-hover hover:border-orbital-primary/50
            ${className}
        `}>
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orbital-primary opacity-30 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orbital-border opacity-30 group-hover:opacity-70 transition-opacity duration-300" />

            {(title || action) && (
                <div className="flex items-center justify-between px-5 py-3 border-b border-orbital-border bg-orbital-bg/30 backdrop-blur-sm">
                    {title && (
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-3 bg-orbital-primary rounded-sm" />
                            <h3 className="text-sm font-mono uppercase tracking-wider text-orbital-primary font-bold">
                                {title}
                            </h3>
                        </div>
                    )}
                    {action && <div>{action}</div>}
                </div>
            )}

            <div className={`flex-grow ${noPadding ? '' : 'p-5'}`}>
                {children}
            </div>
        </div>
    );
};
