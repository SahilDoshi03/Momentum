import { updateProjectMember } from '../../controllers/projectController';
import { updateTeamMember } from '../../controllers/teamController';
import { ProjectMember, TeamMember } from '../../models';
import { mockRequest, mockResponse, mockNext, isSuccessResponse, createTestUser, createTestProject, createTestTeam } from '../utils/testHelpers';

describe('RBAC Controller Tests', () => {
    let owner: any;
    let admin: any;
    let member: any;
    let project: any;
    let teamId: any;

    beforeEach(async () => {
        owner = await createTestUser({ email: 'owner@example.com', username: 'owner' });
        admin = await createTestUser({ email: 'admin@example.com', username: 'admin' });
        member = await createTestUser({ email: 'member@example.com', username: 'member' });

        const team = await createTestTeam(owner._id.toString());
        teamId = team._id;

        project = await createTestProject(owner._id.toString(), { teamId: teamId });

        // Add admin and member to project
        await ProjectMember.create({ projectId: project._id, userId: admin._id, role: 'admin' });
        await ProjectMember.create({ projectId: project._id, userId: member._id, role: 'member' });

        // Add admin and member to team (owner is already added by createTestTeam)
        await TeamMember.create({ teamId: teamId, userId: admin._id, role: 'admin' });
        await TeamMember.create({ teamId: teamId, userId: member._id, role: 'member' });
    });

    describe('updateProjectMember', () => {
        it('should allow owner to update member role', async () => {
            const req = mockRequest({
                params: { id: project._id.toString(), userId: member._id.toString() },
                body: { role: 'admin' },
                user: owner,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateProjectMember(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const updatedMember = await ProjectMember.findOne({ projectId: project._id, userId: member._id });
            expect(updatedMember?.role).toBe('admin');
        });

        it('should allow admin to update member role', async () => {
            const req = mockRequest({
                params: { id: project._id.toString(), userId: member._id.toString() },
                body: { role: 'observer' },
                user: admin,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateProjectMember(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const updatedMember = await ProjectMember.findOne({ projectId: project._id, userId: member._id });
            expect(updatedMember?.role).toBe('observer');
        });

        it('should NOT allow admin to update owner role', async () => {
            const req = mockRequest({
                params: { id: project._id.toString(), userId: owner._id.toString() },
                body: { role: 'member' },
                user: admin,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateProjectMember(req, res, next).catch((err) => next(err));

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });

        it('should NOT allow member to update role', async () => {
            const req = mockRequest({
                params: { id: project._id.toString(), userId: admin._id.toString() },
                body: { role: 'member' },
                user: member,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateProjectMember(req, res, next).catch((err) => next(err));

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
    });

    describe('updateTeamMember', () => {
        it('should allow owner to update team member role', async () => {
            const req = mockRequest({
                params: { id: teamId.toString(), userId: member._id.toString() },
                body: { role: 'admin' },
                user: owner,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateTeamMember(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const updatedMember = await TeamMember.findOne({ teamId: teamId, userId: member._id });
            expect(updatedMember?.role).toBe('admin');
        });

        it('should allow admin to update team member role', async () => {
            const req = mockRequest({
                params: { id: teamId.toString(), userId: member._id.toString() },
                body: { role: 'observer' },
                user: admin,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateTeamMember(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const updatedMember = await TeamMember.findOne({ teamId: teamId, userId: member._id });
            expect(updatedMember?.role).toBe('observer');
        });

        it('should NOT allow admin to update owner role', async () => {
            const req = mockRequest({
                params: { id: teamId.toString(), userId: owner._id.toString() },
                body: { role: 'member' },
                user: admin,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateTeamMember(req, res, next).catch((err) => next(err));

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
    });
});
