import React from 'react';
import { Box } from '@mui/material';

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
        <Box
            component="div"
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                mx: 'auto',
                maxWidth: 1600, // Matches max-w-[1600px]
                overflowY: scrollable ? 'auto' : 'hidden',
                overflowX: 'hidden',
                p: { xs: 2, md: 3 },
            }}
            className={className} // Keep support for custom classes if needed via Tailwind or emotion
        >
            {children}
        </Box>
    );
};
