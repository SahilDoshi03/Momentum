import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { getCurrentUser, validateToken } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import '@testing-library/jest-dom';

// Mock Auth
jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn(),
    validateToken: jest.fn(),
}));

// Mock Next Navigation
const mockPush = jest.fn();
const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: jest.fn(),
}));

describe.skip('ProtectedRoute', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        // No need to mockReturnValue for useRouter as it's already set in factory
    });

    it.skip('renders loading state initially', () => {
        (usePathname as jest.Mock).mockReturnValue('/login');

        render(
            <ProtectedRoute>
                <div data-testid="child">Child Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects to login if no user found', async () => {
        (usePathname as jest.Mock).mockReturnValue('/dashboard');
        (getCurrentUser as jest.Mock).mockReturnValue(null);

        render(
            <ProtectedRoute>
                <div data-testid="child">Child Content</div>
            </ProtectedRoute>
        );

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('redirects to login if token invalid', async () => {
        (usePathname as jest.Mock).mockReturnValue('/dashboard');
        (getCurrentUser as jest.Mock).mockReturnValue({ _id: 'u1' });
        (validateToken as jest.Mock).mockResolvedValue(false);

        render(
            <ProtectedRoute>
                <div data-testid="child">Child Content</div>
            </ProtectedRoute>
        );

        await waitFor(() => {
            expect(validateToken).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('renders children if authenticated and token valid', async () => {
        (usePathname as jest.Mock).mockReturnValue('/dashboard');
        (getCurrentUser as jest.Mock).mockReturnValue({ _id: 'u1' });
        (validateToken as jest.Mock).mockResolvedValue(true);

        render(
            <ProtectedRoute>
                <div data-testid="child">Child Content</div>
            </ProtectedRoute>
        );

        await waitFor(() => {
            expect(screen.getByTestId('child')).toBeInTheDocument();
        });
    });
});
