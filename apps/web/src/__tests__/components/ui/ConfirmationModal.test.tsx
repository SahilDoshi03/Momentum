import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import '@testing-library/jest-dom';

describe('ConfirmationModal', () => {
    const mockOnClose = jest.fn();
    const mockOnConfirm = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                title="Confirm Action"
                message="Are you sure?"
            />
        );
        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        expect(screen.getByText('Confirm')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                title="Confirm Action"
                message="Are you sure?"
            />
        );
        fireEvent.click(screen.getByText('Confirm'));
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                title="Confirm Action"
                message="Are you sure?"
            />
        );
        fireEvent.click(screen.getByText('Cancel'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders custom button text', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                title="Confirm Action"
                message="Are you sure?"
                confirmText="Yes, do it"
                cancelText="No, wait"
            />
        );
        expect(screen.getByText('Yes, do it')).toBeInTheDocument();
        expect(screen.getByText('No, wait')).toBeInTheDocument();
    });

    it('applies danger variant styles', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                title="Confirm Action"
                message="Are you sure?"
                variant="danger"
            />
        );
        const confirmButton = screen.getByText('Confirm');
        expect(confirmButton).toHaveClass('bg-red-600');
    });
});
