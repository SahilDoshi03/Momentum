import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';
import '@testing-library/jest-dom';

describe('Modal', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders when open', () => {
        render(
            <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
                <div>Modal Content</div>
            </Modal>
        );
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <Modal isOpen={false} onClose={mockOnClose}>
                <div>Modal Content</div>
            </Modal>
        );
        expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
        render(
            <Modal isOpen={true} onClose={mockOnClose}>
                <div>Modal Content</div>
            </Modal>
        );
        // The backdrop is the first div with onClick={onClose}
        // It has class "fixed inset-0 bg-black/50"
        // Since we can't easily select by class, we can assume it's the element covering the screen.
        // Or we can add a data-testid to the backdrop in the component, but let's try to find it by generic means.
        // Actually, the backdrop is a sibling of the modal container.

        // Let's modify the component to add data-testid for easier testing, or just use a query selector.
        // But I cannot modify the component just for testing if I can avoid it.
        // The backdrop is an empty div.

        // We can find it by class name if we really have to, or by structure.
        // render returns container.
        const { container } = render(
            <Modal isOpen={true} onClose={mockOnClose}>
                <div>Modal Content</div>
            </Modal>
        );

        // The backdrop is the div with bg-black/50
        const backdrop = container.querySelector('.bg-black\\/50');
        if (backdrop) {
            fireEvent.click(backdrop);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        } else {
            throw new Error('Backdrop not found');
        }
    });

    it('calls onClose when Escape key is pressed', () => {
        render(
            <Modal isOpen={true} onClose={mockOnClose}>
                <div>Modal Content</div>
            </Modal>
        );
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders footer', () => {
        render(
            <Modal isOpen={true} onClose={mockOnClose} footer={<button>Footer Action</button>}>
                <div>Modal Content</div>
            </Modal>
        );
        expect(screen.getByText('Footer Action')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
        render(
            <Modal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
                <div>Modal Content</div>
            </Modal>
        );
        // The close button usually has an icon, or we can look for the button element.
        // The close button calls onClose.
        const buttons = screen.queryAllByRole('button');
        // If showCloseButton is false, and no footer, there should be no buttons.
        expect(buttons).toHaveLength(0);
    });
});
