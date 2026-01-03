import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TopNavbar } from '../../components/TopNavbar';
import { getCurrentUser } from '@/lib/auth';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Mock next-themes
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
    useTheme: () => ({
        theme: 'light',
        setTheme: mockSetTheme,
    }),
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn().mockReturnValue({
        _id: 'user1',
        fullName: 'Test User',
        initials: 'TU',
    }),
    logout: jest.fn().mockResolvedValue(true),
}));

// Mock ProfileIcon
jest.mock('@/components/ui/ProfileIcon', () => ({
    ProfileIcon: () => {
        return <div data-testid="profile-icon" />;
    },
}));

// Mock Icons
jest.mock('@/components/icons', () => ({
    Sun: () => <div data-testid="sun-icon" />,
    Moon: () => <div data-testid="moon-icon" />,
    User: () => <div data-testid="user-icon" />,
    Settings: () => <div data-testid="settings-icon" />,
}));

describe('TopNavbar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders navbar correctly', () => {
        render(<TopNavbar />);
        expect(screen.getByText('Momentum')).toBeInTheDocument();
    });

    it('renders breadcrumbs', () => {
        const breadcrumbs = [
            { label: 'Project', href: '/project' },
            { label: 'Task' },
        ];
        render(<TopNavbar breadcrumbs={breadcrumbs} />);
        expect(screen.getByText('Project')).toBeInTheDocument();
        expect(screen.getByText('Task')).toBeInTheDocument();
    });

    it('toggles theme', () => {
        render(<TopNavbar />);
        const themeButton = screen.getByTestId('moon-icon').closest('button');
        fireEvent.click(themeButton!);
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('navigates to profile page on click', async () => {
        (getCurrentUser as jest.Mock).mockReturnValue({
            _id: 'user1',
            fullName: 'Test User',
            initials: 'TU',
        });

        await waitFor(() => {
            render(<TopNavbar />);
        });

        const profileLink = screen.getByTestId('user-profile-link');
        expect(profileLink).toHaveAttribute('href', '/profile');
    });
});
