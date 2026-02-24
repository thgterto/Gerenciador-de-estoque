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
