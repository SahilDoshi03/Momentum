import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';
import '@testing-library/jest-dom';

describe('Input', () => {
    it('renders correctly', () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
        render(<Input label="Email" id="email" />);
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with error message', () => {
        render(<Input error="Invalid input" />);
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveClass('border-[var(--danger)]');
    });

    it('renders with icon', () => {
        render(<Input icon={<span data-testid="icon">🔍</span>} />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveClass('pl-10');
    });

    it('handles change events', () => {
        const handleChange = jest.fn();
        render(<Input onChange={handleChange} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test' } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('renders disabled state', () => {
        render(<Input disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('renders alternate variant', () => {
        render(<Input variant="alternate" />);
        expect(screen.getByRole('textbox')).toHaveClass('bg-[var(--bg-secondary)]');
    });
});
