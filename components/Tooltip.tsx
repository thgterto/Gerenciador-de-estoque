import React from 'react';
import { Tooltip as MuiTooltip } from '@mui/material';

interface TooltipProps {
    content: string;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
    return (
        <MuiTooltip title={content} placement={position} arrow>
            {children}
        </MuiTooltip>
    );
};
