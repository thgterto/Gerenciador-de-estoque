
import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode; // Área para botões de ação (direita)
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
    title, 
    description, 
    children, 
    className = '' 
}) => {
    return (
        <div className={`mb-6 ${className}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex flex-col gap-1 max-w-3xl">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white tracking-tight leading-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
                
                {/* Actions Toolbar */}
                {children && (
                    <div className="flex flex-wrap gap-3 items-center mt-2 md:mt-0">
                        {children}
                    </div>
                )}
            </div>
            {/* Opcional: Separator line if needed, Polaris usually uses whitespace */}
        </div>
    );
};
