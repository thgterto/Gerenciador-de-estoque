import React from 'react';
import { Link } from 'react-router-dom';

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
        <div className={`flex flex-col gap-4 mb-8 ${className}`}>
            {breadcrumbs && (
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-light">
                    <Link to="/dashboard" className="hover:text-primary transition-colors">Home</Link>
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            <span>/</span>
                            {crumb.path ? (
                                <Link to={crumb.path} className="hover:text-primary transition-colors">{crumb.label}</Link>
                            ) : (
                                <span className="font-bold text-text-main">{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-4 border-black dark:border-white pb-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-text-main">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-text-secondary font-medium tracking-wide">
                            {description}
                        </p>
                    )}
                </div>

                {children && (
                    <div className="flex items-center gap-3">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};
