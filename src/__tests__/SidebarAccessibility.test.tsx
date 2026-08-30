import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../components/Sidebar';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

describe('Sidebar Accessibility', () => {

    const defaultProps = {
        onLogout: vi.fn(),
        notificationsCount: 0,
        onSync: vi.fn(),
        isMobileOpen: false,
        onClose: vi.fn(),
        drawerWidth: 240
    };

    const renderWithContext = (props = defaultProps) => {
        return render(
            <AuthProvider>
                <BrowserRouter>
                    <Sidebar {...props} />
                </BrowserRouter>
            </AuthProvider>
        );
    };

    it('should have aria-hidden on icons', () => {
        const { container } = renderWithContext();

        // Check if SVGs inside the sidebar have aria-hidden="true"
        const svgs = container.querySelectorAll('svg');
        svgs.forEach(svg => {
            expect(svg).toHaveAttribute('aria-hidden', 'true');
        });
    });
});
