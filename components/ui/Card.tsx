
import React from 'react';
import { Card as PolarisCard, Text, Icon, BlockStack, InlineStack, Box } from '@shopify/polaris';
import { getIcon } from '../../utils/iconMapper';
import { Badge as CustomBadge } from './Badge';

export type CardVariant = 'default' | 'metric' | 'item' | 'interactive' | 'flat';
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
}

export const Card: React.FC<CardProps> = ({ 
    children, title, subtitle, value, icon,
    variant = 'default',
    colorScheme = 'neutral',
    padding,
    className = '',
    noBorder: _noBorder = false,
    badge, action, onClick, delay,
}) => {
    
    // Metric Card Layout
    if (variant === 'metric') {
        const polarisIcon = getIcon(icon);
        const iconSource = polarisIcon || (icon ? () => <span className="material-symbols-outlined text-[24px]">{icon}</span> : undefined);

        let iconTone: 'base' | 'subdued' | 'critical' | 'warning' | 'success' | 'info' | 'magic' | undefined = 'base';
        switch (colorScheme) {
            case 'success': iconTone = 'success'; break;
            case 'warning': iconTone = 'warning'; break;
            case 'danger': iconTone = 'critical'; break;
            case 'info': iconTone = 'info'; break;
            case 'primary': iconTone = 'magic'; break;
        }

        return (
            <div onClick={onClick} className={className} style={delay ? { animationDelay: `${delay}ms` } : {}}>
                <PolarisCard>
                    <Box padding="400">
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                {title && <Text as="p" variant="bodyMd" tone="subdued">{title}</Text>}
                                {iconSource && (
                                    <Box padding="100" background="bg-surface-secondary" borderRadius="200">
                                         <Icon source={iconSource} tone={iconTone} />
                                    </Box>
                                )}
                            </InlineStack>
                            <BlockStack gap="200">
                                <Text as="h2" variant="headingXl" fontWeight="bold">
                                    {String(value)}
                                </Text>
                                {subtitle && (
                                    <Text as="p" variant="bodySm" tone="subdued">
                                        {subtitle}
                                    </Text>
                                )}
                            </BlockStack>
                        </BlockStack>
                    </Box>
                </PolarisCard>
            </div>
        );
    }

    const polarisIcon = getIcon(icon);
    const iconSource = polarisIcon || (icon ? () => <span className="material-symbols-outlined">{icon}</span> : undefined);

    // Default/Item Layout
    return (
        <div onClick={onClick} className={`${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} style={delay ? { animationDelay: `${delay}ms` } : {}}>
             <PolarisCard>
                <Box padding={padding === 'p-0' ? '0' : '400'}>
                    <BlockStack gap="400">
                        {(title || subtitle || action || icon || badge) && (
                             <InlineStack align="space-between" blockAlign="center">
                                 <InlineStack gap="300" blockAlign="center">
                                     {iconSource && <div className="p-2 bg-surface-neutral rounded"><Icon source={iconSource} /></div>}
                                     <BlockStack gap="100">
                                         {title && <Text as="h2" variant="headingMd">{title}</Text>}
                                         {subtitle && <Text as="p" variant="bodySm" tone="subdued">{subtitle}</Text>}
                                     </BlockStack>
                                 </InlineStack>
                                 <InlineStack gap="200" align="end">
                                     {badge && <CustomBadge variant={badge.color === 'success' ? 'success' : undefined}>{badge.label}</CustomBadge>}
                                     {action && <div>{action}</div>}
                                 </InlineStack>
                             </InlineStack>
                        )}
                        {children}
                    </BlockStack>
                </Box>
             </PolarisCard>
        </div>
    );
};
