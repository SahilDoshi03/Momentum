import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardComposer } from '@/components/CardComposer';

describe('CardComposer', () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with textarea focused', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveFocus();
    });

    it('calls onSave when form is submitted with valid input', async () => {
        const user = userEvent.setup();
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        await user.type(textarea, 'New Card');
        await user.click(screen.getByRole('button', { name: 'Add card' }));

        expect(mockOnSave).toHaveBeenCalledWith('New Card');
    });

    it('does not call onSave when input is empty', async () => {
        const user = userEvent.setup();
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        await user.click(screen.getByRole('button', { name: 'Add card' }));

        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('handles keyboard navigation', async () => {
        const user = userEvent.setup();
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');

        // Enter submits
        await user.type(textarea, 'New Card{Enter}');
        expect(mockOnSave).toHaveBeenCalledWith('New Card');

        // Escape cancels
        await user.keyboard('{Escape}');
        expect(mockOnCancel).toHaveBeenCalled();
    });
});
