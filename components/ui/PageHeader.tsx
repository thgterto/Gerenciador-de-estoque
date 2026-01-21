
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
    children?: React.ReactNode; // Área para botões de ação (direita)
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
        <div className={`flex flex-col gap-4 mb-6 ${className}`}>
            {breadcrumbs && (
                <nav aria-label="Breadcrumb" className="flex">
                    <ol className="inline-flex items-center space-x-1 md:space-x-2">
                        <li className="inline-flex items-center">
                            <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">
                                <span className="material-symbols-outlined text-[18px] mr-1">home</span>
                                Home
                            </Link>
                        </li>
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index}>
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                                    {crumb.path ? (
                                        <Link to={crumb.path} className="ml-1 text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white md:ml-2">
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="ml-1 text-sm font-medium text-text-main dark:text-white md:ml-2">
                                            {crumb.label}
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </nav>
            )}
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1 max-w-3xl">
                    <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white tracking-tight leading-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-text-secondary dark:text-gray-400 text-base leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
                
                {/* Actions Toolbar */}
                {children && (
                    <div className="flex gap-3 items-center mt-2 md:mt-0">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};
