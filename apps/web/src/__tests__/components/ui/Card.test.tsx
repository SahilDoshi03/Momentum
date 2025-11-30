import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '@/components/ui/Card';
import '@testing-library/jest-dom';

describe('Card', () => {
    it('renders children correctly', () => {
        render(<Card>Card Content</Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = jest.fn();
        render(<Card onClick={handleClick}>Clickable Card</Card>);
        fireEvent.click(screen.getByText('Clickable Card'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
        render(<Card className="custom-class">Content</Card>);
        // The card is the div containing the content
        expect(screen.getByText('Content').closest('div')).toHaveClass('custom-class');
    });

    it('applies dragging styles', () => {
        render(<Card isDragging>Dragging</Card>);
        expect(screen.getByText('Dragging').closest('div')).toHaveClass('opacity-50', 'rotate-2', 'scale-105');
    });

    it('applies cursor pointer when onClick is provided', () => {
        render(<Card onClick={() => { }}>Clickable</Card>);
        expect(screen.getByText('Clickable').closest('div')).toHaveClass('cursor-pointer');
    });
});
