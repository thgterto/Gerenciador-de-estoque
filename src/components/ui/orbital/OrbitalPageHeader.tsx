import React from 'react';
import { ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface Breadcrumb {
    label: string;
    path?: string;
}

interface OrbitalPageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: React.ReactNode;
}

export const OrbitalPageHeader: React.FC<OrbitalPageHeaderProps> = ({
    title,
    description,
    breadcrumbs,
    actions
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-orbital-border pb-4 gap-4 mb-6">
            <div className="space-y-1">
                {breadcrumbs && (
                    <nav className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">
                        <NavLink to="/dashboard" className="hover:text-orbital-primary transition-colors">Home</NavLink>
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={idx}>
                                <ChevronRight size={10} />
                                {crumb.path ? (
                                    <NavLink to={crumb.path} className="hover:text-orbital-primary transition-colors">
                                        {crumb.label}
                                    </NavLink>
                                ) : (
                                    <span className="text-gray-400 font-bold">{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                <h1 className="text-3xl font-display font-bold text-white tracking-tight uppercase">
                    {title}
                </h1>
                {description && (
                    <p className="text-gray-400 font-mono text-sm max-w-2xl">
                        // {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};
