import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrbitalInput } from '../components/ui/orbital/OrbitalInput';

describe('OrbitalInput', () => {
    it('associates label with input', () => {
        render(<OrbitalInput label="Test Label" />);
        // This will succeed if the label is associated with the input
        const input = screen.getByLabelText("Test Label");
        expect(input).toBeInTheDocument();
    });
});
