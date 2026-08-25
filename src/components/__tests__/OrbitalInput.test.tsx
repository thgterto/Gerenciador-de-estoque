import { render, screen } from '@testing-library/react';
import { OrbitalInput } from '../ui/orbital/OrbitalInput';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('OrbitalInput', () => {
    it('associates label with input', () => {
        render(<OrbitalInput label="Test Label" />);
        const input = screen.getByLabelText('Test Label');
        expect(input).toBeInTheDocument();
        expect(input.tagName).toBe('INPUT');
    });

    it('uses provided id if available', () => {
        render(<OrbitalInput label="Test Label 2" id="custom-id" />);
        const input = screen.getByLabelText('Test Label 2');
        expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('generates an id if not provided', () => {
        render(<OrbitalInput label="Test Label 3" />);
        const input = screen.getByLabelText('Test Label 3');
        expect(input).toHaveAttribute('id');
        expect(input.id).not.toBe('');
    });
});
