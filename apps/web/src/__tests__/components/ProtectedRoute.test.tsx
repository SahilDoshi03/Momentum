import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, validateToken } from '@/lib/auth';

// Mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn(),
    validateToken: jest.fn(),
}));

describe('ProtectedRoute', () => {
    const mockRouter = { push: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
    });

    it('renders loading state initially', () => {
        (usePathname as jest.Mock).mockReturnValue('/');
        (getCurrentUser as jest.Mock).mockReturnValue({ id: '1' });
        (validateToken as jest.Mock).mockReturnValue(new Promise(() => { })); // Never resolves to stick in loading

        render(<ProtectedRoute>Content</ProtectedRoute>);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders children if authenticated', async () => {
        (usePathname as jest.Mock).mockReturnValue('/');
        (getCurrentUser as jest.Mock).mockReturnValue({ id: '1' });
        (validateToken as jest.Mock).mockResolvedValue(true);

        render(<ProtectedRoute>Content</ProtectedRoute>);

        await waitFor(() => {
            expect(screen.getByText('Content')).toBeInTheDocument();
        });
    });

    it('redirects if not authenticated', async () => {
        (usePathname as jest.Mock).mockReturnValue('/');
        (getCurrentUser as jest.Mock).mockReturnValue(null);

        render(<ProtectedRoute>Content</ProtectedRoute>);

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/login');
        });
    });

    it('renders children for public routes directly', async () => {
        (usePathname as jest.Mock).mockReturnValue('/login');

        render(<ProtectedRoute>Content</ProtectedRoute>);

        expect(screen.getByText('Content')).toBeInTheDocument();
        expect(validateToken).not.toHaveBeenCalled();
    });
});
