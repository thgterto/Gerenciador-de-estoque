import React from 'react';

interface OrbitalCardProps {
    children: React.ReactNode;
    title?: string;
    action?: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    onClick?: () => void;
}

export const OrbitalCard: React.FC<OrbitalCardProps> = ({
    children,
    title,
    action,
    className = '',
    noPadding = false,
    onClick
}) => {
    return (
        <div
            className={`card-orbital ${className} ${onClick ? 'cursor-pointer hover:bg-orbital-accent/5' : ''}`}
            onClick={onClick}
        >
            {/* Decorative Corner Markers */}
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orbital-accent/30 rounded-bl-lg" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orbital-accent/30 rounded-tr-lg" />

            {(title || action) && (
                <div className="flex items-center justify-between p-4 border-b border-orbital-border bg-orbital-bg/30">
                    {title && (
                        <h3 className="text-lg font-display font-bold uppercase tracking-wide text-orbital-text flex items-center gap-2">
                            <span className="w-1 h-4 bg-orbital-accent inline-block" />
                            {title}
                        </h3>
                    )}
                    {action && <div>{action}</div>}
                </div>
            )}

            <div className={noPadding ? '' : 'p-4'}>
                {children}
            </div>
        </div>
    );
};
