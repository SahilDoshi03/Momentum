import React from 'react';
import { render } from '@testing-library/react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import '@testing-library/jest-dom';

describe('LoadingSpinner', () => {
    it('renders correctly', () => {
        const { container } = render(<LoadingSpinner />);
        expect(container.firstChild).toHaveClass('animate-spin');
    });

    it('applies size classes', () => {
        const { container, rerender } = render(<LoadingSpinner size="sm" />);
        expect(container.firstChild).toHaveClass('h-4', 'w-4');

        rerender(<LoadingSpinner size="lg" />);
        expect(container.firstChild).toHaveClass('h-8', 'w-8');
    });

    it('applies custom className', () => {
        const { container } = render(<LoadingSpinner className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });
});
