import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../components/Header';
import { ThemeProvider } from '../context/ThemeContext';

// Mock ThemeContext
vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('Header Accessibility', () => {
    const defaultProps = {
        onToggleTheme: vi.fn(),
        onBackup: vi.fn(),
        onAddClick: vi.fn(),
        onScanClick: vi.fn(),
        notificationsCount: 0,
        onMenuClick: vi.fn(),
        drawerWidth: 240
    };

    it('should have accessible labels for all icon buttons', () => {
        render(
            <ThemeProvider>
                <Header {...defaultProps} />
            </ThemeProvider>
        );

        expect(screen.getByLabelText('Adicionar Item')).toBeInTheDocument();
        expect(screen.getByLabelText('Scanner')).toBeInTheDocument();
        expect(screen.getByLabelText('Sincronizar')).toBeInTheDocument();
        expect(screen.getByLabelText('Modo Escuro')).toBeInTheDocument(); // assuming light theme
        expect(screen.getByLabelText('Notificações')).toBeInTheDocument();
        expect(screen.getByLabelText('Abrir menu')).toBeInTheDocument();
        expect(screen.getByLabelText('Busca global')).toBeInTheDocument();
    });

    it('should show unread count in notification label', () => {
        render(
            <ThemeProvider>
                <Header {...defaultProps} notificationsCount={5} />
            </ThemeProvider>
        );

        expect(screen.getByLabelText('Notificações (5 não lidas)')).toBeInTheDocument();
    });

    it('should have aria-hidden on icons', () => {
        const { container } = render(
             <ThemeProvider>
                <Header {...defaultProps} />
            </ThemeProvider>
        );

        // Check if SVGs inside buttons have aria-hidden="true"
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
            const svg = button.querySelector('svg');
            if (svg) {
                expect(svg).toHaveAttribute('aria-hidden', 'true');
            }
        });
    });
});
