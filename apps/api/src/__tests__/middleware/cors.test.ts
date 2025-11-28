import { corsOptions } from '../../middleware/cors';
import { config } from '../../config';

describe('CORS Middleware', () => {
    describe('origin callback', () => {
        it('should allow requests with no origin', () => {
            const callback = jest.fn();
            corsOptions.origin(undefined, callback);
            expect(callback).toHaveBeenCalledWith(null, true);
        });

        it('should allow requests from allowed origins', () => {
            const allowedOrigin = config.corsOrigins[0];
            const callback = jest.fn();
            corsOptions.origin(allowedOrigin, callback);
            expect(callback).toHaveBeenCalledWith(null, true);
        });

        it('should block requests from disallowed origins', () => {
            const disallowedOrigin = 'http://evil.com';
            const callback = jest.fn();
            corsOptions.origin(disallowedOrigin, callback);
            expect(callback).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
