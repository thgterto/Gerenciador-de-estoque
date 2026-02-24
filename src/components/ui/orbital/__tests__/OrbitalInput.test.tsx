import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrbitalInput } from '../OrbitalInput';

describe('OrbitalInput Accessibility', () => {
    it('associates label with input', () => {
        render(<OrbitalInput label="Test Input" id="test-id" />);
        // This will fail if the label is not associated with the input
        expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
    });

    it('sets aria-invalid when error is present', () => {
        render(<OrbitalInput label="Error Input" error="Something went wrong" />);
        const input = screen.getByRole('textbox'); // Use getByRole instead of getByLabelText to isolate the issue
        expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('associates error text with input via aria-describedby', () => {
        render(<OrbitalInput label="Described Input" error="Error message" />);
        const input = screen.getByRole('textbox');
        const error = screen.getByText('Error message');
        const describedBy = input.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        expect(error.id).toBe(describedBy);
    });
});
