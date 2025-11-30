import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddList } from '../../components/AddList';
import '@testing-library/jest-dom';

// Mock Icons
jest.mock('@/components/icons', () => ({
    Plus: () => <div data-testid="plus-icon" />,
}));

describe('AddList', () => {
    const mockOnCreateList = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders add list button initially', () => {
        render(<AddList onCreateList={mockOnCreateList} />);
        expect(screen.getByText('Add another list')).toBeInTheDocument();
        expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('switches to form when clicked', () => {
        render(<AddList onCreateList={mockOnCreateList} />);

        fireEvent.click(screen.getByText('Add another list'));

        expect(screen.getByPlaceholderText('Enter list title...')).toBeInTheDocument();
        expect(screen.getByText('Add list')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('submits form with valid name', () => {
        render(<AddList onCreateList={mockOnCreateList} />);

        fireEvent.click(screen.getByText('Add another list'));

        const input = screen.getByPlaceholderText('Enter list title...');
        fireEvent.change(input, { target: { value: 'New List' } });

        fireEvent.click(screen.getByText('Add list'));

        expect(mockOnCreateList).toHaveBeenCalledWith('New List');
        // Should switch back to button
        expect(screen.getByText('Add another list')).toBeInTheDocument();
    });

    it('does not submit empty form', () => {
        render(<AddList onCreateList={mockOnCreateList} />);

        fireEvent.click(screen.getByText('Add another list'));

        fireEvent.click(screen.getByText('Add list'));

        expect(mockOnCreateList).not.toHaveBeenCalled();
        // Should stay in form mode
        expect(screen.getByPlaceholderText('Enter list title...')).toBeInTheDocument();
    });

    it('cancels adding list', () => {
        render(<AddList onCreateList={mockOnCreateList} />);

        fireEvent.click(screen.getByText('Add another list'));

        const input = screen.getByPlaceholderText('Enter list title...');
        fireEvent.change(input, { target: { value: 'Cancelled List' } });

        fireEvent.click(screen.getByText('Cancel'));

        expect(mockOnCreateList).not.toHaveBeenCalled();
        // Should switch back to button
        expect(screen.getByText('Add another list')).toBeInTheDocument();
    });
});
