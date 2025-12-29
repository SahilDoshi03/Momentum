import { getCurrentUser, login, logout, register, validateToken } from '@/lib/auth';
import { apiClient } from '@/lib/api';

// Mock apiClient
jest.mock('@/lib/api', () => ({
    apiClient: {
        login: jest.fn(),
        register: jest.fn(),
        validateToken: jest.fn(),
    },
}));

// LocalStorage is provided by jsdom env

describe('auth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        jest.spyOn(Storage.prototype, 'setItem');
        jest.spyOn(Storage.prototype, 'removeItem');
    });

    describe('getCurrentUser', () => {
        it('returns user from localStorage', () => {
            const user = { _id: '1', fullName: 'Test' };
            localStorage.setItem('currentUser', JSON.stringify(user));
            expect(getCurrentUser()).toEqual({
                ...user,
                id: user._id,
                avatar: null
            });
        });

        it('returns null if no user', () => {
            expect(getCurrentUser()).toBeNull();
        });
    });

    describe('login', () => {
        it('calls api and stores token/user on success', async () => {
            const mockResponse = {
                success: true,
                data: {
                    token: 'token-123',
                    user: { _id: '1', name: 'Test' }
                }
            };
            // @ts-ignore
            apiClient.login.mockResolvedValue(mockResponse);

            await login('test@example.com', 'password');

            expect(apiClient.login).toHaveBeenCalledWith('test@example.com', 'password');
            expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'token-123');
            expect(localStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(mockResponse.data.user));
        });
    });

    describe('logout', () => {
        it('removes token and user from localStorage', () => {
            localStorage.setItem('authToken', 'token');
            localStorage.setItem('currentUser', '{}');

            logout();

            expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
            expect(localStorage.removeItem).toHaveBeenCalledWith('currentUser');
        });
    });

    describe('validateToken', () => {
        it('returns true if api validation succeeds', async () => {
            localStorage.setItem('authToken', 'token');
            // @ts-ignore
            apiClient.validateToken.mockResolvedValue({ success: true, data: { valid: true, user: {} } });

            const isValid = await validateToken();
            expect(isValid).toBe(true);
        });

        it('returns false if no token', async () => {
            const isValid = await validateToken();
            expect(isValid).toBe(false);
        });
    });
});
