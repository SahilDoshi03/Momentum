import { Team } from '../../models/Team';
import { Organization } from '../../models/Organization';

describe('Team Model', () => {
    let testOrganizationId: string;

    beforeEach(async () => {
        const organization = new Organization({
            name: 'Test Organization',
        });
        await organization.save();
        testOrganizationId = organization._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a team with valid data', async () => {
            const teamData = {
                name: 'Test Team',
                organizationId: testOrganizationId,
            };

            const team = new Team(teamData);
            await team.save();

            expect(team._id).toBeDefined();
            expect(team.name).toBe('Test Team');
            expect(team.organizationId).toBe(testOrganizationId);
            expect(team.createdAt).toBeDefined();
            expect(team.createdAt).toBeDefined();
        });

        it('should require name', async () => {
            const team = new Team({
                organizationId: testOrganizationId,
            });

            await expect(team.save()).rejects.toThrow();
        });

        it('should require organizationId', async () => {
            const team = new Team({
                name: 'Test Team',
            });

            await expect(team.save()).rejects.toThrow();
        });

        it('should enforce maximum name length', async () => {
            const longName = 'a'.repeat(101); // Max is 100

            const team = new Team({
                name: longName,
                organizationId: testOrganizationId,
            });

            await expect(team.save()).rejects.toThrow();
        });
    });
});
