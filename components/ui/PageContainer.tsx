
import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    /**
     * Define o comportamento de rolagem:
     * - true: A página inteira rola (Dashboard, Settings, Forms).
     * - false: A página tem altura fixa e o conteúdo interno deve gerenciar o scroll (Tabelas Virtualizadas, Matrizes).
     */
    scrollable?: boolean; 
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
    children, 
    className = '',
    scrollable = false 
}) => {
    return (
        <div 
            className={`
                flex flex-col w-full mx-auto px-4 md:px-6 max-w-[1600px]
                ${scrollable 
                    ? 'h-full overflow-y-auto custom-scrollbar py-6' // Scroll na página
                    : 'h-[100dvh] min-h-0 overflow-hidden py-4'      // Altura travada (Viewport)
                } 
                ${className}
            `}
        >
            {children}
        </div>
    );
};
