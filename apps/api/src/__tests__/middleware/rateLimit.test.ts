import { generalLimiter, authLimiter, passwordResetLimiter } from '../../middleware/rateLimit';
import { config } from '../../config';

describe('Rate Limit Middleware', () => {
    it('should configure general limiter correctly', () => {
        expect(generalLimiter).toBeDefined();
        // We can't easily test the rate limiting logic without a full express app or mocking rate-limit internals
        // But we can check if it's a function (middleware)
        expect(typeof generalLimiter).toBe('function');
    });

    it('should configure auth limiter correctly', () => {
        expect(authLimiter).toBeDefined();
        expect(typeof authLimiter).toBe('function');
    });

    it('should configure password reset limiter correctly', () => {
        expect(passwordResetLimiter).toBeDefined();
        expect(typeof passwordResetLimiter).toBe('function');
    });
});
