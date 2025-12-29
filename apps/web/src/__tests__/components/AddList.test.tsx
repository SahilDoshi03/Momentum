import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddList } from '@/components/AddList';

describe('AddList', () => {
    const mockOnCreateList = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders add button initially', () => {
        render(<AddList onCreateList={mockOnCreateList} />);
        expect(screen.getByText('Add another list')).toBeInTheDocument();
    });

    it('switches to form mode when clicked', async () => {
        const user = userEvent.setup();
        render(<AddList onCreateList={mockOnCreateList} />);

        await user.click(screen.getByText('Add another list'));

        expect(screen.getByPlaceholderText('Enter list title...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add list' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('calls onCreateList when form is submitted with valid input', async () => {
        const user = userEvent.setup();
        render(<AddList onCreateList={mockOnCreateList} />);

        await user.click(screen.getByText('Add another list'));

        const input = screen.getByPlaceholderText('Enter list title...');
        await user.type(input, 'New List');
        await user.click(screen.getByRole('button', { name: 'Add list' }));

        expect(mockOnCreateList).toHaveBeenCalledWith('New List');
    });

    it('does not call onCreateList when input is empty', async () => {
        const user = userEvent.setup();
        render(<AddList onCreateList={mockOnCreateList} />);

        await user.click(screen.getByText('Add another list'));
        await user.click(screen.getByRole('button', { name: 'Add list' }));

        expect(mockOnCreateList).not.toHaveBeenCalled();
    });

    it('resets to button mode when cancelled', async () => {
        const user = userEvent.setup();
        render(<AddList onCreateList={mockOnCreateList} />);

        await user.click(screen.getByText('Add another list'));
        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.getByText('Add another list')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Enter list title...')).not.toBeInTheDocument();
    });
});
