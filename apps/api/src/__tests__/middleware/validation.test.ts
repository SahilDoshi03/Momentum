import { handleValidationErrors } from '../../middleware/validation';
import { mockRequest, mockResponse, mockNext } from '../utils/testHelpers';
import { validationResult } from 'express-validator';

jest.mock('express-validator', () => {
    const mockChain = () => ({
        trim: jest.fn().mockReturnThis(),
        isEmail: jest.fn().mockReturnThis(),
        isLength: jest.fn().mockReturnThis(),
        withMessage: jest.fn().mockReturnThis(),
        notEmpty: jest.fn().mockReturnThis(),
        isHexColor: jest.fn().mockReturnThis(),
        isInt: jest.fn().mockReturnThis(),
        isString: jest.fn().mockReturnThis(),
        isBoolean: jest.fn().mockReturnThis(),
        optional: jest.fn().mockReturnThis(),
        isArray: jest.fn().mockReturnThis(),
        isIn: jest.fn().mockReturnThis(),
        matches: jest.fn().mockReturnThis(),
        toDate: jest.fn().mockReturnThis(),
        isISO8601: jest.fn().mockReturnThis(),
        normalizeEmail: jest.fn().mockReturnThis(),
        isMongoId: jest.fn().mockReturnThis(),
        isNumeric: jest.fn().mockReturnThis(),
    });
    return {
        validationResult: jest.fn(),
        body: jest.fn().mockImplementation(mockChain),
        param: jest.fn().mockImplementation(mockChain),
        query: jest.fn().mockImplementation(mockChain),
    };
});

describe('Validation Middleware', () => {
    describe('handleValidationErrors', () => {
        it('should call next if no errors', () => {
            (validationResult as unknown as jest.Mock).mockReturnValue({
                isEmpty: () => true,
            });

            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            handleValidationErrors(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 400 if errors exist', () => {
            (validationResult as unknown as jest.Mock).mockReturnValue({
                isEmpty: () => false,
                array: () => [
                    { type: 'field', path: 'email', msg: 'Invalid email' },
                ],
            });

            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            handleValidationErrors(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation failed',
                errors: [
                    { field: 'email', message: 'Invalid email' },
                ],
            }));
            expect(next).not.toHaveBeenCalled();
        });
    });
});
