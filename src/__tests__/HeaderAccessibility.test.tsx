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

    const renderHeader = (props = {}) => {
        return render(
            <ThemeProvider>
                <Header {...defaultProps} {...props} />
            </ThemeProvider>
        );
    };

    it('should have accessible labels for all icon buttons', () => {
        renderHeader();

        // These expectations define the desired state
        expect(screen.getByLabelText('Adicionar Item')).toBeInTheDocument();
        expect(screen.getByLabelText('Scanner')).toBeInTheDocument();
        expect(screen.getByLabelText('Sincronizar')).toBeInTheDocument();
        expect(screen.getByLabelText('Modo Escuro')).toBeInTheDocument();
        expect(screen.getByLabelText('Notificações')).toBeInTheDocument();
        expect(screen.getByLabelText('Abrir menu')).toBeInTheDocument();
    });

    it('should show unread count in notification label', () => {
        renderHeader({ notificationsCount: 5 });
        expect(screen.getByLabelText('Notificações (5 não lidas)')).toBeInTheDocument();
    });

    it('should have a label for the search input', () => {
        renderHeader();
        expect(screen.getByLabelText('Busca global')).toBeInTheDocument();
    });
});
