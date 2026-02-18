import React from 'react';
import { Card as MuiCard, CardContent, CardHeader, Box, Typography, SxProps, Theme } from '@mui/material';
import { Icon } from './Icon';
import { Badge } from './Badge';

export type CardVariant = 'default' | 'metric' | 'item' | 'interactive' | 'flat' | 'outlined';
export type ColorScheme = 'neutral' | 'primary' | 'warning' | 'danger' | 'success' | 'info';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    value?: string | number;
    icon?: string;
    variant?: CardVariant;
    colorScheme?: ColorScheme;
    padding?: string;
    className?: string;
    noBorder?: boolean;
    badge?: { label: string; color?: string; };
    action?: React.ReactNode;
    onClick?: () => void;
    delay?: number;
    sx?: SxProps<Theme>;
}

export const Card: React.FC<CardProps> = ({ 
    children, title, subtitle, value, icon,
    variant = 'default',
    colorScheme = 'neutral',
    padding = 'p-6',
    className = '',
    noBorder = false,
    badge, action, onClick, delay,
    sx,
    ...props
}) => {
    
    // Metric Card Layout
    if (variant === 'metric') {
        return (
            <MuiCard
                onClick={onClick}
                sx={{
                    height: '100%',
                    cursor: onClick ? 'pointer' : 'default',
                    position: 'relative',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    transition: 'box-shadow 0.3s',
                    '&:hover': onClick ? { boxShadow: 4 } : {},
                    ...sx
                }}
                elevation={0}
                className={className}
                {...(props as any)}
            >
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        {title && <Typography variant="overline" color="text.secondary" fontWeight="bold">{title}</Typography>}
                        {icon && (
                            <Box p={1} borderRadius={1} bgcolor={`${colorScheme}.light`} color={`${colorScheme}.main`}>
                                <Icon name={icon} size={20} />
                            </Box>
                        )}
                    </Box>
                    <Typography variant="h4" fontWeight="bold">{value}</Typography>
                    {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
                </CardContent>
            </MuiCard>
        );
    }

    // Default Layout
    return (
        <MuiCard
            onClick={onClick}
            sx={{
                cursor: onClick ? 'pointer' : 'default',
                transition: 'box-shadow 0.3s',
                '&:hover': onClick ? { boxShadow: 4 } : {},
                border: (noBorder || variant === 'outlined') ? 'none' : '1px solid',
                borderColor: 'divider',
                height: '100%',
                ...sx
            }}
            variant={variant === 'outlined' ? 'outlined' : 'elevation'}
            elevation={0}
            className={className}
            {...(props as any)}
        >
            {(title || subtitle || action || icon || badge) && (
                 <CardHeader
                    title={title}
                    subheader={subtitle}
                    avatar={icon ? <Box p={1} bgcolor="action.hover" borderRadius={1}><Icon name={icon} /></Box> : null}
                    action={
                        <Box display="flex" alignItems="center" gap={1}>
                            {badge && <Badge variant={badge.color as any}>{badge.label}</Badge>}
                            {action}
                        </Box>
                    }
                    titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                 />
            )}
            <CardContent className={padding === 'p-0' ? '!p-0' : ''}>
                {children}
            </CardContent>
        </MuiCard>
    );
};
