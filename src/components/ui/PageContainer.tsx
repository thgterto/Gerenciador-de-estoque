import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
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
                w-full h-full flex flex-col mx-auto max-w-[1600px]
                ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}
                overflow-x-hidden
                p-4 md:p-6
                ${className}
            `}
        >
            {children}
        </div>
    );
};
