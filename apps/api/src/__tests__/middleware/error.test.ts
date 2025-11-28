import { errorHandler, AppError, notFound, asyncHandler } from '../../middleware/error';
import { mockRequest, mockResponse, mockNext } from '../utils/testHelpers';

describe('Error Middleware', () => {
    describe('AppError', () => {
        it('should create an operational error with status code', () => {
            const error = new AppError('Test Error', 400);
            expect(error.message).toBe('Test Error');
            expect(error.statusCode).toBe(400);
            expect(error.isOperational).toBe(true);
        });

        it('should default to 500 status code', () => {
            const error = new AppError('Test Error');
            expect(error.statusCode).toBe(500);
        });
    });

    describe('errorHandler', () => {
        let consoleSpy: jest.SpyInstance;

        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        });

        afterEach(() => {
            consoleSpy.mockRestore();
        });

        it('should handle AppError', () => {
            const error = new AppError('Test Error', 400);
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Test Error',
            }));
        });

        it('should handle Mongoose CastError', () => {
            const error: any = new Error('CastError');
            error.name = 'CastError';
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Resource not found',
            }));
        });

        it('should handle Mongoose Duplicate Key Error', () => {
            const error: any = new Error('MongoError');
            error.name = 'MongoError';
            error.code = 11000;
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Duplicate field value entered',
            }));
        });

        it('should handle Mongoose ValidationError', () => {
            const error: any = new Error('ValidationError');
            error.name = 'ValidationError';
            error.errors = {
                field: { message: 'Validation failed' },
            };
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Validation failed',
            }));
        });

        it('should handle JWT Error', () => {
            const error: any = new Error('JsonWebTokenError');
            error.name = 'JsonWebTokenError';
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Invalid token',
            }));
        });

        it('should handle TokenExpiredError', () => {
            const error: any = new Error('TokenExpiredError');
            error.name = 'TokenExpiredError';
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Token expired',
            }));
        });
    });

    describe('notFound', () => {
        it('should create 404 error', () => {
            const req = mockRequest({ originalUrl: '/api/unknown' });
            const res = mockResponse();
            const next = mockNext();

            notFound(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(404);
            expect(error.message).toContain('/api/unknown');
        });
    });

    describe('asyncHandler', () => {
        it('should catch errors in async functions', async () => {
            const error = new Error('Async Error');
            const fn = async () => { throw error; };
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await asyncHandler(fn)(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
