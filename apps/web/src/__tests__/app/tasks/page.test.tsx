import React from 'react';
import { render, screen } from '@testing-library/react';
import TasksPage from '@/app/tasks/page';

// Mock components
jest.mock('@/components/TopNavbar', () => ({
    TopNavbar: ({ breadcrumbs }: { breadcrumbs: { label: string }[] }) => (
        <div data-testid="top-navbar">
            {breadcrumbs.map(b => b.label).join(', ')}
        </div>
    ),
}));

jest.mock('@/components/MyTasks', () => ({
    MyTasks: () => <div data-testid="mytasks-component" />,
}));

describe('TasksPage', () => {
    it('renders TopNavbar with correct breadcrumbs', () => {
        render(<TasksPage />);

        const navbar = screen.getByTestId('top-navbar');
        expect(navbar).toBeInTheDocument();
        expect(navbar).toHaveTextContent('My Tasks');
    });

    it('renders MyTasks component', () => {
        render(<TasksPage />);
        expect(screen.getByTestId('mytasks-component')).toBeInTheDocument();
    });
});
