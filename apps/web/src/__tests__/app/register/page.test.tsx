import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/register/page';
import * as auth from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
    register: jest.fn(),
    getCurrentUser: jest.fn(),
    validateToken: jest.fn(),
}));

jest.mock('@/components/ui/Input', () => ({
    Input: (props: any) => (
        <div>
            <input data-testid="mock-input" {...props} />
            {props.error && <span>{props.error}</span>}
        </div>
    ),
}));

jest.mock('@/components/ui/Button', () => ({
    Button: ({ children, ...props }: any) => <button data-testid="mock-button" {...props}>{children}</button>,
}));

describe('RegisterPage', () => {
    const mockRouter = { push: jest.fn() };
    const mockSearchParams = { get: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
        (auth.getCurrentUser as jest.Mock).mockReturnValue(null);
    });

    it('renders registration form', () => {
        render(<RegisterPage />);

        expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('First name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('validates password mismatch', async () => {
        const user = userEvent.setup();
        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('First name'), 'John');
        await user.type(screen.getByPlaceholderText('Last name'), 'Doe');
        await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Create a password'), 'password');
        await user.type(screen.getByPlaceholderText('Confirm your password'), 'mismatch');

        await user.click(screen.getByRole('button', { name: 'Create account' }));

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        });
        expect(auth.register).not.toHaveBeenCalled();
    });

    it('handles successful registration', async () => {
        const user = userEvent.setup();
        (auth.register as jest.Mock).mockResolvedValue({ id: '1' });
        mockSearchParams.get.mockReturnValue(null);

        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('First name'), 'John');
        await user.type(screen.getByPlaceholderText('Last name'), 'Doe');
        await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Create a password'), 'Password123!');
        await user.type(screen.getByPlaceholderText('Confirm your password'), 'Password123!');

        await user.click(screen.getByRole('button', { name: 'Create account' }));

        await waitFor(() => {
            expect(auth.register).toHaveBeenCalled();
            expect(mockRouter.push).toHaveBeenCalledWith('/');
        });
    });

    it('redirects to join page when invite token is present', async () => {
        const user = userEvent.setup();
        (auth.register as jest.Mock).mockResolvedValue({ id: '1' });
        mockSearchParams.get.mockReturnValue('invite-token');

        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('First name'), 'John');
        await user.type(screen.getByPlaceholderText('Last name'), 'Doe');
        await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Create a password'), 'Password123!');
        await user.type(screen.getByPlaceholderText('Confirm your password'), 'Password123!');

        await user.click(screen.getByRole('button', { name: 'Create account' }));

        await waitFor(() => {
            expect(auth.register).toHaveBeenCalled();
            expect(mockRouter.push).toHaveBeenCalledWith('/join/invite-token');
        });
    });

    it('handles registration error', async () => {
        const user = userEvent.setup();
        (auth.register as jest.Mock).mockRejectedValue(new Error('Email already exists'));

        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('First name'), 'John');
        await user.type(screen.getByPlaceholderText('Last name'), 'Doe');
        await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Create a password'), 'Password123!');
        await user.type(screen.getByPlaceholderText('Confirm your password'), 'Password123!');

        await user.click(screen.getByRole('button', { name: 'Create account' }));

        await waitFor(() => {
            expect(screen.getByText('Email already exists')).toBeInTheDocument();
        });
    });

    it('passes invite token to login link', () => {
        mockSearchParams.get.mockReturnValue('invite-123');
        render(<RegisterPage />);

        const loginLink = screen.getByText('Sign in');
        expect(loginLink).toHaveAttribute('href', '/login?invite=invite-123');
    });
});
