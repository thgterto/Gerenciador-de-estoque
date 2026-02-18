import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    children?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
    title, 
    description,
    breadcrumbs, 
    children, 
    className = '' 
}) => {
    return (
        <div className={`mb-6 ${className}`}>
            {breadcrumbs && (
                <nav className="flex items-center text-sm text-orbital-subtext mb-4">
                    <RouterLink to="/dashboard" className="hover:text-orbital-accent transition-colors">
                        Home
                    </RouterLink>
                    {breadcrumbs.map((crumb, idx) => (
                        <div key={idx} className="flex items-center">
                            <ChevronRight size={14} className="mx-2 text-orbital-border" />
                            {crumb.path ? (
                                <RouterLink
                                    to={crumb.path}
                                    className="hover:text-orbital-accent transition-colors"
                                >
                                    {crumb.label}
                                </RouterLink>
                            ) : (
                                <span className="text-orbital-text font-medium">
                                    {crumb.label}
                                </span>
                            )}
                        </div>
                    ))}
                </nav>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-orbital-border pb-4">
                <div>
                    <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-orbital-text mb-1">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-orbital-subtext text-sm">
                            {description}
                        </p>
                    )}
                </div>

                {children && (
                    <div className="flex gap-3">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};
