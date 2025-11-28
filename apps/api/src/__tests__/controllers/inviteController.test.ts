import { createInvite, getInvite, acceptInvite } from '../../controllers/inviteController';
import { TeamInvite, Team, TeamMember, User } from '../../models';
import { mockRequest, mockResponse, mockNext, isSuccessResponse, createTestUser, createTestTeam } from '../utils/testHelpers';
import { v4 as uuidv4 } from 'uuid';

// Helper to create a test team with owner
const createTestTeamWithOwner = async (ownerId: string) => {
    const team = new Team({
        name: 'Test Team',
        organizationId: 'some-org-id', // Mock or create org if needed, but schema validation might require valid ID
    });
    // We need a valid organization for the team
    const Organization = require('../../models/Organization').Organization;
    const org = new Organization({ name: 'Test Org' });
    await org.save();
    team.organizationId = org._id.toString();

    await team.save();

    await TeamMember.create({
        teamId: team._id.toString(),
        userId: ownerId,
        role: 'owner',
    });

    return team;
};

describe('Invite Controller', () => {
    let testUser: any;
    let testTeam: any;

    beforeEach(async () => {
        testUser = await createTestUser();
        testTeam = await createTestTeamWithOwner(testUser._id.toString());
    });

    describe('createInvite', () => {
        it('should create a new invite', async () => {
            const req = mockRequest({
                params: { id: testTeam._id.toString() },
                body: { email: 'invitee@example.com' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await createInvite(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            expect(res.status).toHaveBeenCalledWith(201);

            const invite = await TeamInvite.findOne({ email: 'invitee@example.com' });
            expect(invite).toBeDefined();
            expect(invite!.teamId.toString()).toBe(testTeam._id.toString());
        });

        it('should return existing invite if active', async () => {
            await TeamInvite.create({
                teamId: testTeam._id,
                creatorId: testUser._id,
                email: 'invitee@example.com',
                token: uuidv4(),
                expiresAt: new Date(Date.now() + 86400000),
            });

            const req = mockRequest({
                params: { id: testTeam._id.toString() },
                body: { email: 'invitee@example.com' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await createInvite(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            // Should not create a new one
            const invites = await TeamInvite.find({ email: 'invitee@example.com' });
            expect(invites).toHaveLength(1);
        });

        it('should fail if user is not admin/owner', async () => {
            const otherUser = await createTestUser({ email: 'other@example.com', username: 'other' });
            // Add as member
            await TeamMember.create({
                teamId: testTeam._id.toString(),
                userId: otherUser._id.toString(),
                role: 'member',
            });

            const req = mockRequest({
                params: { id: testTeam._id.toString() },
                body: { email: 'invitee@example.com' },
                user: otherUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await createInvite(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
    });

    describe('getInvite', () => {
        it('should return invite details', async () => {
            const token = uuidv4();
            await TeamInvite.create({
                teamId: testTeam._id,
                creatorId: testUser._id,
                email: 'invitee@example.com',
                token,
                expiresAt: new Date(Date.now() + 86400000),
            });

            const req = mockRequest({
                params: { token },
            });
            const res = mockResponse();
            const next = mockNext();

            await getInvite(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data.email).toBe('invitee@example.com');
        });

        it('should fail for invalid token', async () => {
            const req = mockRequest({
                params: { token: 'invalid-token' },
            });
            const res = mockResponse();
            const next = mockNext();

            await getInvite(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(404);
        });
    });

    describe('acceptInvite', () => {
        it('should accept invite and add user to team', async () => {
            const invitee = await createTestUser({ email: 'invitee@example.com', username: 'invitee' });
            const token = uuidv4();
            await TeamInvite.create({
                teamId: testTeam._id,
                creatorId: testUser._id,
                email: 'invitee@example.com',
                token,
                expiresAt: new Date(Date.now() + 86400000),
            });

            const req = mockRequest({
                params: { token },
                user: invitee,
            });
            const res = mockResponse();
            const next = mockNext();

            await acceptInvite(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);

            const member = await TeamMember.findOne({ teamId: testTeam._id, userId: invitee._id });
            expect(member).toBeDefined();

            const invite = await TeamInvite.findOne({ token });
            expect(invite!.isActive).toBe(false);
        });

        it('should fail if email does not match', async () => {
            const otherUser = await createTestUser({ email: 'other@example.com', username: 'other' });
            const token = uuidv4();
            await TeamInvite.create({
                teamId: testTeam._id,
                creatorId: testUser._id,
                email: 'invitee@example.com',
                token,
                expiresAt: new Date(Date.now() + 86400000),
            });

            const req = mockRequest({
                params: { token },
                user: otherUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await acceptInvite(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
    });
});
