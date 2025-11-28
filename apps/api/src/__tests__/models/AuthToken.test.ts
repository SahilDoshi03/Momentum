import { AuthToken } from '../../models/AuthToken';
import { createTestUser } from '../utils/testHelpers';

describe('AuthToken Model', () => {
    let testUserId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        testUserId = testUser._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create an auth token with valid data', async () => {
            const tokenData = {
                userId: testUserId,
                token: 'test-token-123',
                expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
            };

            const authToken = new AuthToken(tokenData);
            await authToken.save();

            expect(authToken._id).toBeDefined();
            expect(authToken.userId).toBe(testUserId);
            expect(authToken.token).toBe('test-token-123');
            expect(authToken.expiresAt).toBeInstanceOf(Date);
            expect(authToken.createdAt).toBeDefined();
            expect(authToken.createdAt).toBeDefined();
        });

        it('should require userId', async () => {
            const authToken = new AuthToken({
                token: 'test-token-123',
                expiresAt: new Date(),
            });

            await expect(authToken.save()).rejects.toThrow();
        });

        it('should require token', async () => {
            const authToken = new AuthToken({
                userId: testUserId,
                expiresAt: new Date(),
            });

            await expect(authToken.save()).rejects.toThrow();
        });

        it('should require expiresAt', async () => {
            const authToken = new AuthToken({
                userId: testUserId,
                token: 'test-token-123',
            });

            await expect(authToken.save()).rejects.toThrow();
        });

        it('should enforce unique token', async () => {
            const tokenData = {
                userId: testUserId,
                token: 'unique-token',
                expiresAt: new Date(),
            };

            await new AuthToken(tokenData).save();

            const duplicateToken = new AuthToken({
                userId: testUserId,
                token: 'unique-token',
                expiresAt: new Date(),
            });

            await expect(duplicateToken.save()).rejects.toThrow();
        });
    });
});
