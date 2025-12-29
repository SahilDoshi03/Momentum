import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock components
jest.mock('@/components/TopNavbar', () => ({
    TopNavbar: () => <div data-testid="top-navbar" />,
}));

jest.mock('@/components/ProjectsList', () => ({
    ProjectsList: () => <div data-testid="projects-list" />,
}));

describe('Home Page', () => {
    it('renders TopNavbar and ProjectsList', () => {
        render(<Home />);

        expect(screen.getByTestId('top-navbar')).toBeInTheDocument();
        expect(screen.getByTestId('projects-list')).toBeInTheDocument();
    });

    it('has correct layout classes', () => {
        const { container } = render(<Home />);

        // Check for the wrapper div class
        const wrapper = container.firstChild;
        expect(wrapper).toHaveClass('min-h-screen');
        expect(wrapper).toHaveClass('bg-[var(--bg-primary)]');
    });
});
