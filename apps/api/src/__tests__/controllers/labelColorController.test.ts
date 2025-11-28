import { getLabelColors } from '../../controllers/labelColorController';
import { LabelColor } from '../../models';
import { mockRequest, mockResponse, mockNext, isSuccessResponse } from '../utils/testHelpers';

describe('LabelColor Controller', () => {
    describe('getLabelColors', () => {
        it('should return all label colors sorted by position', async () => {
            await LabelColor.create({ name: 'Blue', colorHex: '#0000FF', position: 2 });
            await LabelColor.create({ name: 'Red', colorHex: '#FF0000', position: 1 });

            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await getLabelColors(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data).toHaveLength(2);
            expect(data[0].name).toBe('Red');
            expect(data[1].name).toBe('Blue');
        });

        it('should return empty array if no colors exist', async () => {
            // Clear any existing colors first (though beforeEach in setup might handle this)
            await LabelColor.deleteMany({});

            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await getLabelColors(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data).toHaveLength(0);
        });
    });
});
