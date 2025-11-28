import { TeamInvite } from '../../models/TeamInvite';
import { Team } from '../../models/Team';
import { Organization } from '../../models/Organization';
import { createTestUser } from '../utils/testHelpers';

describe('TeamInvite Model', () => {
    let testTeamId: string;
    let testCreatorId: string;

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
        testCreatorId = user._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a team invite with valid data', async () => {
            const inviteData = {
                teamId: testTeamId,
                token: 'invite-token-123',
                creatorId: testCreatorId,
                email: 'invitee@example.com',
                expiresAt: new Date(Date.now() + 86400000), // 24 hours
            };

            const invite = new TeamInvite(inviteData);
            await invite.save();

            expect(invite._id).toBeDefined();
            expect(invite.teamId.toString()).toBe(testTeamId);
            expect(invite.token).toBe('invite-token-123');
            expect(invite.creatorId.toString()).toBe(testCreatorId);
            expect(invite.email).toBe('invitee@example.com');
            expect(invite.isActive).toBe(true);
            expect(invite.createdAt).toBeDefined();
            expect(invite.updatedAt).toBeDefined();
        });

        it('should require teamId', async () => {
            const invite = new TeamInvite({
                token: 'invite-token-123',
                creatorId: testCreatorId,
                email: 'invitee@example.com',
                expiresAt: new Date(),
            });

            await expect(invite.save()).rejects.toThrow();
        });

        it('should require token', async () => {
            const invite = new TeamInvite({
                teamId: testTeamId,
                creatorId: testCreatorId,
                email: 'invitee@example.com',
                expiresAt: new Date(),
            });

            await expect(invite.save()).rejects.toThrow();
        });

        it('should require creatorId', async () => {
            const invite = new TeamInvite({
                teamId: testTeamId,
                token: 'invite-token-123',
                email: 'invitee@example.com',
                expiresAt: new Date(),
            });

            await expect(invite.save()).rejects.toThrow();
        });

        it('should require email', async () => {
            const invite = new TeamInvite({
                teamId: testTeamId,
                token: 'invite-token-123',
                creatorId: testCreatorId,
                expiresAt: new Date(),
            });

            await expect(invite.save()).rejects.toThrow();
        });

        it('should require expiresAt', async () => {
            const invite = new TeamInvite({
                teamId: testTeamId,
                token: 'invite-token-123',
                creatorId: testCreatorId,
                email: 'invitee@example.com',
            });

            await expect(invite.save()).rejects.toThrow();
        });

        it('should enforce unique token', async () => {
            const inviteData = {
                teamId: testTeamId,
                token: 'unique-token',
                creatorId: testCreatorId,
                email: 'invitee@example.com',
                expiresAt: new Date(),
            };

            await new TeamInvite(inviteData).save();

            const duplicateInvite = new TeamInvite({
                teamId: testTeamId,
                token: 'unique-token',
                creatorId: testCreatorId,
                email: 'other@example.com',
                expiresAt: new Date(),
            });

            await expect(duplicateInvite.save()).rejects.toThrow();
        });
    });
});
