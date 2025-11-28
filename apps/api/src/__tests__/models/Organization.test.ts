import { Organization } from '../../models/Organization';

describe('Organization Model', () => {
    describe('Schema Validation', () => {
        it('should create an organization with valid data', async () => {
            const orgData = {
                name: 'Test Organization',
            };

            const organization = new Organization(orgData);
            await organization.save();

            expect(organization._id).toBeDefined();
            expect(organization.name).toBe('Test Organization');
            expect(organization.createdAt).toBeDefined();
            expect(organization.createdAt).toBeDefined();
        });

        it('should require name', async () => {
            const organization = new Organization({});

            await expect(organization.save()).rejects.toThrow();
        });

        it('should enforce maximum name length', async () => {
            const longName = 'a'.repeat(101); // Max is 100

            const organization = new Organization({
                name: longName,
            });

            await expect(organization.save()).rejects.toThrow();
        });
    });
});
