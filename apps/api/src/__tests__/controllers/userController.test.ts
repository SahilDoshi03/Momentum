import { getUsers, getUserById, getCurrentUser, updateUser, deleteUser, getUserTeams, getUserProjects, searchUsers } from '../../controllers/userController';
import { User, TeamMember, ProjectMember, Team, Project, Organization } from '../../models';
import { mockRequest, mockResponse, mockNext, isSuccessResponse, createTestUser } from '../utils/testHelpers';

describe('User Controller', () => {
    let testUser: any;

    beforeEach(async () => {
        testUser = await createTestUser();
    });

    describe('getUsers', () => {
        it('should return all users', async () => {
            await createTestUser({ email: 'other@example.com', username: 'other' });

            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await getUsers(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('getUserById', () => {
        it('should return user details', async () => {
            const req = mockRequest({
                params: { id: testUser._id.toString() },
            });
            const res = mockResponse();
            const next = mockNext();

            await getUserById(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data._id.toString()).toBe(testUser._id.toString());
        });

        it('should fail for non-existent user', async () => {
            const req = mockRequest({
                params: { id: '000000000000000000000000' },
            });
            const res = mockResponse();
            const next = mockNext();

            await getUserById(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(404);
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user with roles', async () => {
            const req = mockRequest({
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await getCurrentUser(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data._id.toString()).toBe(testUser._id.toString());
            expect(data.teamRoles).toBeDefined();
            expect(data.projectRoles).toBeDefined();
        });
    });

    describe('updateUser', () => {
        it('should update user profile', async () => {
            const req = mockRequest({
                params: { id: testUser._id.toString() },
                body: { fullName: 'Updated Name' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateUser(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);

            const user = await User.findById(testUser._id);
            expect(user!.fullName).toBe('Updated Name');
            expect(user!.initials).toBe('UN');
        });

        it('should fail if updating another user without admin role', async () => {
            const otherUser = await createTestUser({ email: 'other@example.com', username: 'other' });
            const req = mockRequest({
                params: { id: otherUser._id.toString() },
                body: { fullName: 'Updated Name' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
    });

    describe('deleteUser', () => {
        it('should soft delete user', async () => {
            const req = mockRequest({
                params: { id: testUser._id.toString() },
            });
            const res = mockResponse();
            const next = mockNext();

            await deleteUser(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);

            const user = await User.findById(testUser._id);
            expect(user!.active).toBe(false);
        });
    });

    describe('getUserTeams', () => {
        it('should return user teams', async () => {
            const org = await Organization.create({ name: 'Test Org' });
            const team = await Team.create({ name: 'Test Team', organizationId: org._id });
            await TeamMember.create({ teamId: team._id, userId: testUser._id, role: 'member' });

            const req = mockRequest({
                params: { id: testUser._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await getUserTeams(req, res, next);


            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data).toHaveLength(1);
            expect(data[0].teamId.name).toBe('Test Team');
        });
    });

    describe('getUserProjects', () => {
        it('should return user projects', async () => {
            const project = await Project.create({ name: 'Test Project', shortId: 'TP1' });
            await ProjectMember.create({ projectId: project._id, userId: testUser._id, role: 'member' });

            const req = mockRequest({
                params: { id: testUser._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await getUserProjects(req, res, next);


            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data).toHaveLength(1);
            expect(data[0].projectId.name).toBe('Test Project');
        });
    });

    describe('searchUsers', () => {
        it('should search users by name', async () => {
            await createTestUser({ email: 'search@example.com', fullName: 'Search Me', username: 'search' });

            const req = mockRequest({
                query: { query: 'Search' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await searchUsers(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data).toHaveLength(1);
            expect(data[0].fullName).toBe('Search Me');
        });
    });
});
