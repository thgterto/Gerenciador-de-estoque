import { render, screen } from '@testing-library/react';
import { Tooltip } from '../Tooltip';
import { describe, it, expect } from 'vitest';

describe('Tooltip Component', () => {
  it('renders children correctly', () => {
    render(
      <Tooltip content="Test Tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });
});
