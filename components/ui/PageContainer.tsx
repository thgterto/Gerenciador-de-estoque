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
                height: '100%', // Ensures full height in fixed mode
                minHeight: scrollable ? '100%' : 'auto', // Ensures expansion in scroll mode
                display: 'flex',
                flexDirection: 'column',
                mx: 'auto',
                maxWidth: '100%', // Changed from 1600 to 100% to fill container
                overflowY: scrollable ? 'auto' : 'hidden',
                overflowX: 'hidden',
                p: { xs: 2, md: 3 },
            }}
            className={className}
        >
            <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {children}
            </Box>
        </Box>
    );
};
