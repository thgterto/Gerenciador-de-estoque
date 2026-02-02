
import React from 'react';
import { BlockStack, InlineStack, Text, Box } from '@shopify/polaris';
import { Link } from 'react-router-dom';

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
        <Box paddingBlockEnd="400" className={className}>
            <BlockStack gap="400">
                {breadcrumbs && (
                    <InlineStack gap="200">
                        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--p-color-text-subdued)' }}>
                            <Text as="span" variant="bodySm" tone="subdued">Home</Text>
                        </Link>
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={idx}>
                                <Text as="span" variant="bodySm" tone="subdued">/</Text>
                                {crumb.path ? (
                                    <Link to={crumb.path} style={{ textDecoration: 'none', color: 'var(--p-color-text-subdued)' }}>
                                        <Text as="span" variant="bodySm" tone="subdued">{crumb.label}</Text>
                                    </Link>
                                ) : (
                                    <Text as="span" variant="bodySm" fontWeight="bold">{crumb.label}</Text>
                                )}
                            </React.Fragment>
                        ))}
                    </InlineStack>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                    <BlockStack gap="200">
                        <Text as="h1" variant="headingXl" fontWeight="bold">
                            {title}
                        </Text>
                        {description && (
                            <Text as="p" tone="subdued" variant="bodyMd">
                                {description}
                            </Text>
                        )}
                    </BlockStack>

                    {children && (
                        <InlineStack gap="300">
                            {children}
                        </InlineStack>
                    )}
                </div>
            </BlockStack>
        </Box>
    );
};
