import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link, Stack } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

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
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                    sx={{ mb: 2 }}
                >
                    <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard">
                        Home
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
                            <Typography key={idx} color="text.primary">
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
                    borderBottom: 1,
                    borderColor: 'divider',
                    pb: 2
                }}
            >
                <Box>
                    <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                        {title}
                    </Typography>
                    {description && (
                        <Typography variant="body1" color="text.secondary">
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
