import { apiClient, ApiResponse } from '@/lib/api';

// Mock fetch global
global.fetch = jest.fn();

describe('apiClient', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        localStorage.clear();
    });

    it('makes requests with correct headers', async () => {
        localStorage.setItem('authToken', 'test-token');
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: {} }),
        });

        await apiClient.getProjects('team-1');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/projects?teamId=team-1'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json',
                }),
            })
        );
    });

    it('handles 401 unauthorized errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ message: 'Unauthorized' }),
        });

        // We expect it might throw or return error response depending on implementation
        // Looking at api.ts (from memory), it throws ApiError
        await expect(apiClient.getProjects('team-1')).rejects.toThrow();
    });

    it('returns data on success', async () => {
        const mockData = { id: 1, name: 'Test' };
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockData }),
        });

        const result = await apiClient.getProjects('team-1');
        expect(result).toEqual({ success: true, data: mockData });
    });
});
