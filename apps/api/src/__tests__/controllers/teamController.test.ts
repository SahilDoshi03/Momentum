import { getTeams, getTeamById, createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, getTeamMembers } from '../../controllers/teamController';
import { Team, TeamMember, Organization } from '../../models';
import { mockRequest, mockResponse, mockNext, isSuccessResponse, createTestUser } from '../utils/testHelpers';

describe('Team Controller', () => {
    let testUser: any;
    let testTeam: any;
    let testOrg: any;

    beforeEach(async () => {
        testUser = await createTestUser();
        testOrg = await Organization.create({ name: 'Test Org' });
        testTeam = await Team.create({ name: 'Test Team', organizationId: testOrg._id });
        await TeamMember.create({ teamId: testTeam._id, userId: testUser._id, role: 'owner' });
    });

    describe('getTeams', () => {
        it('should return teams for user', async () => {
            const req = mockRequest({
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await getTeams(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data).toHaveLength(1);
            expect(data[0]._id.toString()).toBe(testTeam._id.toString());
        });
    });

    describe('getTeamById', () => {
        it('should return team details', async () => {
            const req = mockRequest({
                params: { id: testTeam._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await getTeamById(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data._id.toString()).toBe(testTeam._id.toString());
        });

        it('should fail if user is not a member', async () => {
            const otherUser = await createTestUser({ email: 'other@example.com', username: 'other' });
            const req = mockRequest({
                params: { id: testTeam._id.toString() },
                user: otherUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await getTeamById(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
    });

    describe('createTeam', () => {
        it('should create a new team', async () => {
            const req = mockRequest({
                body: { name: 'New Team', organizationId: testOrg._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await createTeam(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            expect(res.status).toHaveBeenCalledWith(201);

            const team = await Team.findOne({ name: 'New Team' });
            expect(team).toBeDefined();

            const member = await TeamMember.findOne({ teamId: team!._id, userId: testUser._id });
            expect(member).toBeDefined();
            expect(member!.role).toBe('owner');
        });
    });

    describe('updateTeam', () => {
        it('should update team details', async () => {
            const req = mockRequest({
                params: { id: testTeam._id.toString() },
                body: { name: 'Updated Team' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateTeam(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);

            const team = await Team.findById(testTeam._id);
            expect(team!.name).toBe('Updated Team');
        });
    });

    describe('deleteTeam', () => {
        it('should delete team and members', async () => {
            const req = mockRequest({
                params: { id: testTeam._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await deleteTeam(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);

            const team = await Team.findById(testTeam._id);
            expect(team).toBeNull();

            const members = await TeamMember.find({ teamId: testTeam._id });
            expect(members).toHaveLength(0);
        });
    });

    describe('addTeamMember', () => {
        it('should add a member to the team', async () => {
            const newUser = await createTestUser({ email: 'new@example.com', username: 'newuser' });
            const req = mockRequest({
                params: { id: testTeam._id.toString() },
                body: { userId: newUser._id.toString(), role: 'member' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await addTeamMember(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            expect(res.status).toHaveBeenCalledWith(201);

            const member = await TeamMember.findOne({ teamId: testTeam._id, userId: newUser._id });
            expect(member).toBeDefined();
            expect(member!.role).toBe('member');
        });
    });

    describe('removeTeamMember', () => {
        it('should remove a member from the team', async () => {
            const newUser = await createTestUser({ email: 'new@example.com', username: 'newuser' });
            await TeamMember.create({
                teamId: testTeam._id,
                userId: newUser._id,
                role: 'member',
            });

            const req = mockRequest({
                params: { id: testTeam._id.toString(), userId: newUser._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await removeTeamMember(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);

            const member = await TeamMember.findOne({ teamId: testTeam._id, userId: newUser._id });
            expect(member).toBeNull();
        });
    });
});
