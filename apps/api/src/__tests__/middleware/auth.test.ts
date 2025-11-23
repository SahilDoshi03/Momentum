import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { createTestUser, mockRequest, mockResponse, mockNext } from '../utils/testHelpers';
import { config } from '../../config';

describe('Auth Middleware', () => {
    describe('authenticateToken', () => {
        let testUser: any;
        let validToken: string;

        beforeEach(async () => {
            testUser = await createTestUser();
            validToken = jwt.sign({ userId: testUser._id }, config.jwtSecret, {
                expiresIn: '7d',
            });
        });

        it('should authenticate valid token from Authorization header', async () => {
            const req = mockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await authenticateToken(req, res, next);

            expect(req.user).toBeDefined();
            expect(req.user._id.toString()).toBe(testUser._id.toString());
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should authenticate valid token from cookies', async () => {
            const req = mockRequest({
                cookies: {
                    authToken: validToken,
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await authenticateToken(req, res, next);

            expect(req.user).toBeDefined();
            expect(req.user._id.toString()).toBe(testUser._id.toString());
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if no token provided', async () => {
            const req = mockRequest({
                headers: {},
                cookies: {},
            });
            const res = mockResponse();
            const next = mockNext();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access token required',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is invalid', async () => {
            const req = mockRequest({
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid token',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is expired', async () => {
            const expiredToken = jwt.sign({ userId: testUser._id }, config.jwtSecret, {
                expiresIn: '-1s', // Already expired
            });

            const req = mockRequest({
                headers: {
                    authorization: `Bearer ${expiredToken}`,
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid token',
            });
        });

        it('should return 401 if user is inactive', async () => {
            testUser.active = false;
            await testUser.save();

            const req = mockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid or expired token',
            });
        });

        it('should return 401 if user does not exist', async () => {
            const nonExistentUserId = '507f1f77bcf86cd799439011';
            const tokenForNonExistentUser = jwt.sign(
                { userId: nonExistentUserId },
                config.jwtSecret,
                { expiresIn: '7d' }
            );

            const req = mockRequest({
                headers: {
                    authorization: `Bearer ${tokenForNonExistentUser}`,
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid or expired token',
            });
        });

        it('should not include password in user object', async () => {
            const req = mockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await authenticateToken(req, res, next);

            expect(req.user).toBeDefined();
            expect(req.user.password).toBeUndefined();
        });
    });

    describe('requireRole', () => {
        let adminUser: any;
        let memberUser: any;
        let observerUser: any;

        beforeEach(async () => {
            adminUser = await createTestUser({
                email: 'admin@example.com',
                username: 'admin',
                role: 'admin',
            });

            memberUser = await createTestUser({
                email: 'member@example.com',
                username: 'member',
                role: 'member',
            });

            observerUser = await createTestUser({
                email: 'observer@example.com',
                username: 'observer',
                role: 'observer',
            });
        });

        it('should allow access if user has required role', () => {
            const middleware = requireRole(['admin', 'owner']);
            const req = mockRequest({ user: adminUser });
            const res = mockResponse();
            const next = mockNext();

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access if user does not have required role', () => {
            const middleware = requireRole(['admin', 'owner']);
            const req = mockRequest({ user: observerUser });
            const res = mockResponse();
            const next = mockNext();

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Insufficient permissions',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should deny access if user is not authenticated', () => {
            const middleware = requireRole(['admin']);
            const req = mockRequest({ user: null });
            const res = mockResponse();
            const next = mockNext();

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Authentication required',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should work with multiple allowed roles', () => {
            const middleware = requireRole(['admin', 'user', 'member']);
            const req = mockRequest({ user: memberUser });
            const res = mockResponse();
            const next = mockNext();

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should work with single role', () => {
            const middleware = requireRole(['admin']);
            const req = mockRequest({ user: adminUser });
            const res = mockResponse();
            const next = mockNext();

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
