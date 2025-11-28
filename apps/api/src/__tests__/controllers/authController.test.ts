import { register, login, logout, validateToken, getMe } from '../../controllers/authController';
import { User, AuthToken } from '../../models';
import { mockRequest, mockResponse, mockNext, getErrorMessage, isSuccessResponse } from '../utils/testHelpers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Auth Controller', () => {
    describe('register', () => {
        it('should register a new user', async () => {
            const req = mockRequest({
                body: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    password: 'password123',
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await register(req, res, next);


            expect(isSuccessResponse(res)).toBe(true);
            expect(res.status).toHaveBeenCalledWith(201);

            const user = await User.findOne({ email: 'john@example.com' });
            expect(user).toBeDefined();
            expect(user!.fullName).toBe('John Doe');
            expect(user!.initials).toBe('JD');
        });

        it('should fail if user already exists', async () => {
            await User.create({
                fullName: 'Existing User',
                email: 'existing@example.com',
                password: 'password123',
                initials: 'EU',
                profileIcon: { initials: 'EU', bgColor: '#000000' },
            });

            const req = mockRequest({
                body: {
                    firstName: 'Existing',
                    lastName: 'User',
                    email: 'existing@example.com',
                    password: 'password123',
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await register(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.message).toBe('User with this email already exists');
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            await User.create({
                fullName: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            });
        });

        it('should login with valid credentials', async () => {
            const req = mockRequest({
                body: {
                    email: 'test@example.com',
                    password: 'password123',
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await login(req, res, next);


            expect(isSuccessResponse(res)).toBe(true);
            expect(res.cookie).toHaveBeenCalledWith('authToken', expect.any(String), expect.any(Object));
        });

        it('should fail with invalid password', async () => {
            const req = mockRequest({
                body: {
                    email: 'test@example.com',
                    password: 'wrongpassword',
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await login(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.message).toBe('Invalid credentials');
        });

        it('should fail with non-existent email', async () => {
            const req = mockRequest({
                body: {
                    email: 'nonexistent@example.com',
                    password: 'password123',
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await login(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.message).toBe('Invalid credentials');
        });
    });

    describe('logout', () => {
        it('should clear cookie and remove token', async () => {
            const token = 'test-token';
            await AuthToken.create({
                userId: 'some-user-id',
                token,
                expiresAt: new Date(Date.now() + 3600000),
            });

            const req = mockRequest({
                cookies: { authToken: token },
            });
            const res = mockResponse();
            const next = mockNext();

            await logout(req, res, next);


            expect(isSuccessResponse(res)).toBe(true);
            expect(res.clearCookie).toHaveBeenCalledWith('authToken');

            const storedToken = await AuthToken.findOne({ token });
            expect(storedToken).toBeNull();
        });
    });

    describe('validateToken', () => {
        it('should return valid true for valid token', async () => {
            const user = await User.create({
                fullName: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            });

            const token = jwt.sign({ userId: user._id }, config.jwtSecret);

            const req = mockRequest({
                cookies: { authToken: token },
            });
            const res = mockResponse();
            const next = mockNext();

            await validateToken(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data.valid).toBe(true);
            expect(data.user.email).toBe('test@example.com');
        });

        it('should return valid false for invalid token', async () => {
            const req = mockRequest({
                cookies: { authToken: 'invalid-token' },
            });
            const res = mockResponse();
            const next = mockNext();

            await validateToken(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data.valid).toBe(false);
            expect(data.user).toBeNull();
        });

        it('should return valid false for missing token', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await validateToken(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data.valid).toBe(false);
            expect(data.user).toBeNull();
        });
    });

    describe('getMe', () => {
        it('should return current user', async () => {
            const user = await User.create({
                fullName: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            });

            const req = mockRequest({
                user,
            });
            const res = mockResponse();
            const next = mockNext();

            await getMe(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data.email).toBe('test@example.com');
        });
    });
});
