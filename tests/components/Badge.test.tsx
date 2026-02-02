import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/ui/Badge';
import { AppProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import React from 'react';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider i18n={en}>
        {children}
    </AppProvider>
);

describe('Badge', () => {
    it('renders children correctly', () => {
        render(<Badge>Test Badge</Badge>, { wrapper: Wrapper });
        expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders with icon fallback', () => {
        render(<Badge icon="non_existent_icon_xyz">With Icon</Badge>, { wrapper: Wrapper });
        expect(screen.getByText('non_existent_icon_xyz')).toBeInTheDocument();
    });
});
