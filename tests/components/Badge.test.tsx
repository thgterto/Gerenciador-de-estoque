import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/ui/Badge';

describe('Badge', () => {
    it('renders children correctly', () => {
        render(<Badge>Test Badge</Badge>);
        expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders with icon', () => {
        render(<Badge icon="check">With Icon</Badge>);
        expect(screen.getByText('check')).toBeInTheDocument();
    });
});
