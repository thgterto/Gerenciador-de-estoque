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
    // scrollable = false // Deprecated: Layout handles scroll now
}) => {
    return (
        <Box
            component="div"
            sx={{
                width: '100%',
                // height: '100%', // REMOVED: Allow height to grow with content for global scroll
                minHeight: '100%', // Ensure it fills at least the viewport
                display: 'flex',
                flexDirection: 'column',
                mx: 'auto',
                maxWidth: 1600,
                // overflowY: scrollable ? 'auto' : 'hidden', // REMOVED: Let parent (Layout) handle scroll
                overflow: 'visible', // Allow overflow
                p: { xs: 2, md: 3 },
            }}
            className={className}
        >
            {children}
        </Box>
    );
};
