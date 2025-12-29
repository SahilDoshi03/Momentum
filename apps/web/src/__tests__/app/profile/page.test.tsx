import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';

// Mock components
jest.mock('@/components/TopNavbar', () => ({
    TopNavbar: ({ breadcrumbs }: { breadcrumbs: { label: string }[] }) => (
        <div data-testid="top-navbar">
            {breadcrumbs.map(b => b.label).join(', ')}
        </div>
    ),
}));

jest.mock('@/components/Profile', () => ({
    Profile: () => <div data-testid="profile-component" />,
}));

describe('ProfilePage', () => {
    it('renders TopNavbar with correct breadcrumbs', () => {
        render(<ProfilePage />);

        const navbar = screen.getByTestId('top-navbar');
        expect(navbar).toBeInTheDocument();
        expect(navbar).toHaveTextContent('Profile');
    });

    it('renders Profile component', () => {
        render(<ProfilePage />);
        expect(screen.getByTestId('profile-component')).toBeInTheDocument();
    });
});
