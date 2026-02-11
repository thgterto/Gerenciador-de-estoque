import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link, Stack } from '@mui/material';
// Using text separator for brutalist feel

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
        <Box sx={{ mb: 4 }} className={className}>
            {breadcrumbs && (
                <Breadcrumbs
                    separator={<Typography color="text.secondary" fontFamily='"JetBrains Mono", monospace'>/</Typography>}
                    aria-label="breadcrumb"
                    sx={{ mb: 1, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', textTransform: 'uppercase' }}
                >
                    <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard">
                        HOME
                    </Link>
                    {breadcrumbs.map((crumb, idx) => (
                        crumb.path ? (
                            <Link
                                key={idx}
                                underline="hover"
                                color="inherit"
                                component={RouterLink}
                                to={crumb.path}
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <Typography key={idx} color="text.primary" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                                {crumb.label}
                            </Typography>
                        )
                    ))}
                </Breadcrumbs>
            )}

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'flex-end' }}
                spacing={2}
                sx={{
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    pb: 2
                }}
            >
                <Box>
                    <Typography
                        variant="h3"
                        component="h1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{
                            textTransform: 'uppercase',
                            letterSpacing: '-0.03em',
                            mb: 0.5
                        }}
                    >
                        {title}
                    </Typography>
                    {description && (
                        <Typography
                            variant="overline"
                            color="text.secondary"
                            sx={{
                                display: 'block',
                                lineHeight: 1.2,
                                fontFamily: '"JetBrains Mono", monospace'
                            }}
                        >
                            {description}
                        </Typography>
                    )}
                </Box>

                {children && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {children}
                    </Box>
                )}
            </Stack>
        </Box>
    );
};
