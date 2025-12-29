import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/register/page';
import * as auth from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Mock mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
    register: jest.fn(),
    getCurrentUser: jest.fn(),
    validateToken: jest.fn(),
}));

jest.mock('@/components/ui/Input', () => ({
    Input: (props: any) => <input data-testid="mock-input" {...props} />,
}));

jest.mock('@/components/ui/Button', () => ({
    Button: ({ children, ...props }: any) => <button data-testid="mock-button" {...props}>{children}</button>,
}));

describe('RegisterPage', () => {
    const mockRouter = { push: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (auth.getCurrentUser as jest.Mock).mockReturnValue(null);
    });

    it('renders registration form', () => {
        render(<RegisterPage />);

        expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your first name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your last name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('validates password mismatch', async () => {
        const user = userEvent.setup();
        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('Enter your first name'), 'John');
        await user.type(screen.getByPlaceholderText('Enter your last name'), 'Doe');
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

        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('Enter your first name'), 'John');
        await user.type(screen.getByPlaceholderText('Enter your last name'), 'Doe');
        await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Create a password'), 'password123');
        await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123');

        await user.click(screen.getByRole('button', { name: 'Create account' }));

        await waitFor(() => {
            expect(auth.register).toHaveBeenCalledWith({
                firstName: 'John',
                lastName: 'Doe',
                email: 'test@example.com',
                password: 'password123'
            });
            expect(mockRouter.push).toHaveBeenCalledWith('/');
        });
    });

    it('handles registration error', async () => {
        const user = userEvent.setup();
        (auth.register as jest.Mock).mockRejectedValue(new Error('Email already exists'));

        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('Enter your first name'), 'John');
        await user.type(screen.getByPlaceholderText('Enter your last name'), 'Doe');
        await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Create a password'), 'password123');
        await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123');

        await user.click(screen.getByRole('button', { name: 'Create account' }));

        await waitFor(() => {
            expect(screen.getByText('Email already exists')).toBeInTheDocument();
        });
    });
});
