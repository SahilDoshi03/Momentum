import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profile } from '@/components/Profile';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Mocks
jest.mock('@/lib/api', () => ({
    apiClient: {
        validateToken: jest.fn(),
        updateUser: jest.fn(),
    },
}));

jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(),
    useQueryClient: () => ({
        setQueryData: jest.fn(),
    }),
}));

// Mock child components
jest.mock('@/components/ui/ProfileIcon', () => ({
    ProfileIcon: () => <div data-testid="profile-icon" />
}));

describe('Profile', () => {
    const mockUser = {
        _id: '1',
        fullName: 'John Doe',
        email: 'john@example.com',
        bio: 'Test Bio',
        initials: 'JD'
    };

    const mockRouter = { push: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
    });

    it('renders loading state', () => {
        const { useQuery } = require('@tanstack/react-query');
        useQuery.mockReturnValue({ isLoading: true, data: null });

        render(<Profile />);
        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('renders user info when loaded', () => {
        const { useQuery } = require('@tanstack/react-query');
        useQuery.mockReturnValue({ isLoading: false, data: mockUser });

        render(<Profile />);

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('toggles edit mode', async () => {
        const user = userEvent.setup();
        const { useQuery } = require('@tanstack/react-query');
        useQuery.mockReturnValue({ isLoading: false, data: mockUser });

        render(<Profile />);

        // Fields disabled initially
        expect(screen.getByLabelText('Full Name')).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Edit Profile' }));

        // Fields enabled
        expect(screen.getByLabelText('Full Name')).not.toBeDisabled();

        // Cancel reverts
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.getByLabelText('Full Name')).toBeDisabled();
    });

    it('updates profile', async () => {
        const user = userEvent.setup();
        const { useQuery, useMutation } = require('@tanstack/react-query');
        useQuery.mockReturnValue({ isLoading: false, data: mockUser });
        const mockMutate = jest.fn();
        useMutation.mockReturnValue({ mutate: mockMutate });

        render(<Profile />);

        await user.click(screen.getByRole('button', { name: 'Edit Profile' }));

        const nameInput = screen.getByLabelText('Full Name');
        await user.clear(nameInput);
        await user.type(nameInput, 'Jane Doe');

        await user.click(screen.getByRole('button', { name: 'Save Changes' }));

        expect(mockMutate).toHaveBeenCalled();
    });
});
