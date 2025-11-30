import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Profile } from '../../components/Profile';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import '@testing-library/jest-dom';

// Mock API
jest.mock('@/lib/api', () => ({
    apiClient: {
        validateToken: jest.fn(),
        updateUser: jest.fn(),
    },
}));

// Mock Auth
jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn(),
}));

// Mock Toast
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock Next Navigation
const mockPush = jest.fn();
const mockRouter = { push: mockPush };
jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

// Mock Next Themes
jest.mock('next-themes', () => ({
    useTheme: () => ({
        theme: 'light',
        setTheme: jest.fn(),
    }),
}));

// Mock Icons
jest.mock('@/components/icons', () => ({
    Sun: () => <div data-testid="sun-icon" />,
    Moon: () => <div data-testid="moon-icon" />,
}));

// Mock ProfileIcon
jest.mock('@/components/ui/ProfileIcon', () => ({
    ProfileIcon: () => <div data-testid="profile-icon" />,
}));

const mockUser = {
    _id: 'user1',
    fullName: 'Test User',
    email: 'test@example.com',
    bio: 'Test Bio',
    initials: 'TU',
    profileIcon: { bgColor: '#000' },
};

describe('Profile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('renders profile with current user data from localStorage', async () => {
        (getCurrentUser as jest.Mock).mockReturnValue(mockUser);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
            expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test Bio')).toBeInTheDocument();
        });
    });

    it('fetches user from API if not in localStorage', async () => {
        (getCurrentUser as jest.Mock).mockReturnValue(null);
        (apiClient.validateToken as jest.Mock).mockResolvedValue({
            success: true,
            data: { user: mockUser },
        });

        render(<Profile />);

        await waitFor(() => {
            expect(apiClient.validateToken).toHaveBeenCalled();
            expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        });
    });

    it('redirects to login if user fetch fails', async () => {
        (getCurrentUser as jest.Mock).mockReturnValue(null);
        (apiClient.validateToken as jest.Mock).mockRejectedValue(new Error('Failed'));

        render(<Profile />);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('enables editing mode', async () => {
        (getCurrentUser as jest.Mock).mockReturnValue(mockUser);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        });

        const nameInput = screen.getByLabelText('Full Name');
        expect(nameInput).toBeDisabled();

        fireEvent.click(screen.getByText('Edit Profile'));

        expect(nameInput).not.toBeDisabled();
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('updates user profile', async () => {
        (getCurrentUser as jest.Mock).mockReturnValue(mockUser);
        (apiClient.updateUser as jest.Mock).mockResolvedValue({
            success: true,
            data: { ...mockUser, fullName: 'Updated Name' },
        });

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit Profile'));

        const nameInput = screen.getByLabelText('Full Name');
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

        fireEvent.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(apiClient.updateUser).toHaveBeenCalledWith('user1', {
                fullName: 'Updated Name',
                bio: 'Test Bio',
            });
            expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
            expect(screen.getByText('Edit Profile')).toBeInTheDocument(); // Should exit edit mode
        });
    });

    it('cancels editing', async () => {
        (getCurrentUser as jest.Mock).mockReturnValue(mockUser);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit Profile'));

        const nameInput = screen.getByLabelText('Full Name');
        fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

        fireEvent.click(screen.getByText('Cancel'));

        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        expect(nameInput).toBeDisabled();
    });
});
