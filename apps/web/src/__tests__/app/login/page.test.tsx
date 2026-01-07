import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
import * as auth from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    validateToken: jest.fn(),
}));

jest.mock('@/components/ui/Input', () => ({
    Input: (props: any) => <input data-testid="mock-input" {...props} />,
}));

jest.mock('@/components/ui/Button', () => ({
    Button: ({ children, ...props }: any) => <button data-testid="mock-button" {...props}>{children}</button>,
}));

describe('LoginPage', () => {
    const mockRouter = { push: jest.fn() };
    const mockSearchParams = { get: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
        (auth.getCurrentUser as jest.Mock).mockReturnValue(null);
    });

    it('renders login form', () => {
        render(<LoginPage />);

        expect(screen.getByText('Welcome back')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
        const user = userEvent.setup();
        (auth.login as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });
        mockSearchParams.get.mockReturnValue(null);

        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'password');

        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(auth.login).toHaveBeenCalledWith('test@example.com', 'password');
            expect(mockRouter.push).toHaveBeenCalledWith('/');
        });
    });

    it('redirects to join page on success if invite token present', async () => {
        const user = userEvent.setup();
        (auth.login as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });
        mockSearchParams.get.mockReturnValue('invite-123');

        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'password');

        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/join/invite-123');
        });
    });

    it('passes invite token to register link', () => {
        mockSearchParams.get.mockReturnValue('invite-123');
        render(<LoginPage />);

        const registerLink = screen.getByText('Sign up');
        expect(registerLink).toHaveAttribute('href', '/register?invite=invite-123');
    });

    it('handles login failure', async () => {
        const user = userEvent.setup();
        (auth.login as jest.Mock).mockResolvedValue(null);

        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpass');

        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
        });
    });

    it('redirects if already logged in and token is valid', async () => {
        (auth.getCurrentUser as jest.Mock).mockReturnValue({ id: '1' });
        (auth.validateToken as jest.Mock).mockResolvedValue(true);

        render(<LoginPage />);

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/');
        });
    });
});
