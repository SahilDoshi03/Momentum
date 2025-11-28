import { LabelColor } from '../../models/LabelColor';

describe('LabelColor Model', () => {
    describe('Schema Validation', () => {
        it('should create a label color with valid data', async () => {
            const labelColorData = {
                name: 'Red',
                colorHex: '#FF0000',
                position: 1,
            };

            const labelColor = new LabelColor(labelColorData);
            await labelColor.save();

            expect(labelColor._id).toBeDefined();
            expect(labelColor.name).toBe('Red');
            expect(labelColor.colorHex).toBe('#FF0000');
            expect(labelColor.position).toBe(1);
        });

        it('should require name', async () => {
            const labelColor = new LabelColor({
                colorHex: '#FF0000',
            });

            await expect(labelColor.save()).rejects.toThrow();
        });

        it('should require colorHex', async () => {
            const labelColor = new LabelColor({
                name: 'Red',
            });

            await expect(labelColor.save()).rejects.toThrow();
        });

        it('should validate colorHex format', async () => {
            const labelColor = new LabelColor({
                name: 'Invalid Color',
                colorHex: 'invalid-hex',
            });

            await expect(labelColor.save()).rejects.toThrow();
        });

        it('should have default position', async () => {
            const labelColor = new LabelColor({
                name: 'Blue',
                colorHex: '#0000FF',
            });
            await labelColor.save();

            expect(labelColor.position).toBe(0);
        });
    });
});
