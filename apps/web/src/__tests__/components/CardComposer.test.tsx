import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardComposer } from '../../components/CardComposer';
import '@testing-library/jest-dom';

describe('CardComposer', () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with default placeholder', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        expect(screen.getByPlaceholderText('Enter a title for this card...')).toBeInTheDocument();
        expect(screen.getByText('Add card')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} placeholder="Custom placeholder" />);

        expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('updates textarea value on change', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        fireEvent.change(textarea, { target: { value: 'New Card' } });

        expect(textarea).toHaveValue('New Card');
    });

    it('calls onSave when form is submitted', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        fireEvent.change(textarea, { target: { value: 'New Card' } });

        fireEvent.click(screen.getByText('Add card'));

        expect(mockOnSave).toHaveBeenCalledWith('New Card');
    });

    it('calls onSave when Enter is pressed', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        fireEvent.change(textarea, { target: { value: 'New Card' } });

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });

        expect(mockOnSave).toHaveBeenCalledWith('New Card');
    });

    it('does not call onSave when Shift+Enter is pressed', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        fireEvent.change(textarea, { target: { value: 'New Card' } });

        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true, code: 'Enter', charCode: 13 });

        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('does not call onSave if input is empty', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        fireEvent.click(screen.getByText('Add card'));

        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('calls onCancel when Cancel button is clicked', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        fireEvent.click(screen.getByText('Cancel'));

        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('calls onCancel when Escape is pressed', () => {
        render(<CardComposer onSave={mockOnSave} onCancel={mockOnCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        textarea.focus();

        fireEvent.keyDown(textarea, { key: 'Escape', code: 'Escape', charCode: 27 });

        expect(mockOnCancel).toHaveBeenCalled();
    });
});
