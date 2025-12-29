import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AuthCallbackPage from '../../../../app/auth/callback/page';
import { apiClient } from '../../../../lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock the apiClient
jest.mock('../../../../lib/api', () => ({
    apiClient: {
        getCurrentUser: jest.fn(),
    },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

describe('AuthCallbackPage', () => {
    const mockRouter = {
        push: jest.fn(),
    };
    const mockSearchParams = {
        get: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

        // Mock localStorage
        const localStorageMock = (function () {
            let store: Record<string, string> = {};
            return {
                getItem: jest.fn((key: string) => store[key] || null),
                setItem: jest.fn((key: string, value: string) => {
                    store[key] = value.toString();
                }),
                clear: jest.fn(() => {
                    store = {};
                }),
                removeItem: jest.fn((key: string) => {
                    delete store[key];
                }),
            };
        })();

        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
        });

        // Suppress console.error for expected error tests
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should show loading state initially', () => {
        mockSearchParams.get.mockReturnValue('valid-token');
        (apiClient.getCurrentUser as jest.Mock).mockImplementation(() => new Promise(() => { })); // Never resolves

        render(<AuthCallbackPage />);

        expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    });

    it('should handle successful authentication', async () => {
        const token = 'valid-token-123';
        const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' };

        mockSearchParams.get.mockReturnValue(token);
        (apiClient.getCurrentUser as jest.Mock).mockResolvedValue({
            success: true,
            data: mockUser,
        });

        render(<AuthCallbackPage />);

        // Verify token was stored immediately
        await waitFor(() => {
            expect(localStorage.setItem).toHaveBeenCalledWith('authToken', token);
        });

        // Verify API call
        expect(apiClient.getCurrentUser).toHaveBeenCalled();

        // Verify user data stored and redirect
        await waitFor(() => {
            expect(localStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(mockUser));
            expect(mockRouter.push).toHaveBeenCalledWith('/');
        });
    });

    it('should redirect to login with error when token is missing', async () => {
        mockSearchParams.get.mockReturnValue(null);

        render(<AuthCallbackPage />);

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/login?error=no_token');
        });

        expect(apiClient.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should redirect to login when API validation fails', async () => {
        const token = 'invalid-token';
        mockSearchParams.get.mockReturnValue(token);
        (apiClient.getCurrentUser as jest.Mock).mockResolvedValue({
            success: false,
        });

        render(<AuthCallbackPage />);

        // Token is stored optimistically before validation
        expect(localStorage.setItem).toHaveBeenCalledWith('authToken', token);

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/login?error=auth_failed');
        });
    });

    it('should handle API exceptions gracefully', async () => {
        const token = 'token-causing-error';
        mockSearchParams.get.mockReturnValue(token);
        (apiClient.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Network error'));

        render(<AuthCallbackPage />);

        await waitFor(() => {
            // Should catch error and redirect
            expect(mockRouter.push).toHaveBeenCalledWith('/login?error=auth_failed');
            expect(console.error).toHaveBeenCalledWith('Auth callback error:', expect.any(Error));
        });
    });
});
