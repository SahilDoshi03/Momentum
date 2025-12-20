import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TopNavbar } from '../../components/TopNavbar';
import '@testing-library/jest-dom';
import { getCurrentUser } from '@/lib/auth';

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
        const React = jest.requireActual('react');
        return React.createElement('div', { 'data-testid': 'profile-icon' });
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
        expect(screen.getByText('Taskcafe')).toBeInTheDocument();
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

    it('opens user menu and logs out', async () => {
        (getCurrentUser as jest.Mock).mockReturnValue({
            _id: 'user1',
            fullName: 'Test User',
            initials: 'TU',
        });

        await waitFor(() => {
            render(<TopNavbar />);
        });

        // Wait for user to load
        // Open menu
        await waitFor(() => {
            expect(screen.getByTestId('profile-icon')).toBeInTheDocument();
        });
        const profileIcon = screen.getByTestId('profile-icon');
        fireEvent.click(profileIcon);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
        });

        // Logout
        fireEvent.click(screen.getByRole('button', { name: /logout/i }));
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });
});
