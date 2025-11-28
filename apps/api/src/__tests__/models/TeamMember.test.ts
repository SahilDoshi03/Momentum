import { TeamMember } from '../../models/TeamMember';
import { Team } from '../../models/Team';
import { Organization } from '../../models/Organization';
import { createTestUser } from '../utils/testHelpers';

describe('TeamMember Model', () => {
    let testTeamId: string;
    let testUserId: string;

    beforeEach(async () => {
        const organization = new Organization({
            name: 'Test Organization',
        });
        await organization.save();

        const team = new Team({
            name: 'Test Team',
            organizationId: organization._id.toString(),
        });
        await team.save();
        testTeamId = team._id.toString();

        const user = await createTestUser();
        testUserId = user._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a team member with valid data', async () => {
            const teamMemberData = {
                teamId: testTeamId,
                userId: testUserId,
                role: 'member',
            };

            const teamMember = new TeamMember(teamMemberData);
            await teamMember.save();

            expect(teamMember._id).toBeDefined();
            expect(teamMember.teamId).toBe(testTeamId);
            expect(teamMember.userId).toBe(testUserId);
            expect(teamMember.role).toBe('member');
            expect(teamMember.addedDate).toBeDefined();
        });

        it('should require teamId', async () => {
            const teamMember = new TeamMember({
                userId: testUserId,
            });

            await expect(teamMember.save()).rejects.toThrow();
        });

        it('should require userId', async () => {
            const teamMember = new TeamMember({
                teamId: testTeamId,
            });

            await expect(teamMember.save()).rejects.toThrow();
        });

        it('should enforce valid role', async () => {
            const teamMember = new TeamMember({
                teamId: testTeamId,
                userId: testUserId,
                role: 'invalid-role',
            });

            await expect(teamMember.save()).rejects.toThrow();
        });

        it('should enforce unique user in team', async () => {
            const teamMemberData = {
                teamId: testTeamId,
                userId: testUserId,
            };

            await new TeamMember(teamMemberData).save();

            const duplicateMember = new TeamMember(teamMemberData);

            await expect(duplicateMember.save()).rejects.toThrow();
        });
    });
});
