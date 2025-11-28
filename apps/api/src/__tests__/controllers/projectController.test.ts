import { getProjects, getProjectById, createProject, updateProject, deleteProject, addProjectMember, removeProjectMember, getProjectLabels, createProjectLabel, updateProjectLabel, deleteProjectLabel } from '../../controllers/projectController';
import { Project, ProjectMember, TaskGroup, ProjectLabel, LabelColor } from '../../models';
import { mockRequest, mockResponse, mockNext, isSuccessResponse, createTestUser, createTestProject } from '../utils/testHelpers';

describe('Project Controller', () => {
    let testUser: any;
    let testProject: any;

    beforeEach(async () => {
        testUser = await createTestUser();
        testProject = await createTestProject(testUser._id.toString());
    });

    describe('getProjects', () => {
        it('should return projects for user', async () => {
            const req = mockRequest({
                user: testUser,
                query: {},
            });
            const res = mockResponse();
            const next = mockNext();

            await getProjects(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data).toHaveLength(1);
            expect(data[0]._id.toString()).toBe(testProject._id.toString());
        });
    });

    describe('getProjectById', () => {
        it('should return project details', async () => {
            const req = mockRequest({
                params: { id: testProject._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await getProjectById(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data._id.toString()).toBe(testProject._id.toString());
            expect(data.members).toBeDefined();
            expect(data.taskGroups).toBeDefined();
        });

        it('should fail if user is not a member', async () => {
            const otherUser = await createTestUser({ email: 'other@example.com', username: 'other' });
            const req = mockRequest({
                params: { id: testProject._id.toString() },
                user: otherUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await getProjectById(req, res, next);

            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
        });
    });

    describe('createProject', () => {
        it('should create a new project', async () => {
            const req = mockRequest({
                body: { name: 'New Project' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await createProject(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            expect(res.status).toHaveBeenCalledWith(201);

            const project = await Project.findOne({ name: 'New Project' });
            expect(project).toBeDefined();

            const member = await ProjectMember.findOne({ projectId: project!._id, userId: testUser._id });
            expect(member).toBeDefined();
            expect(member!.role).toBe('owner');

            const groups = await TaskGroup.find({ projectId: project!._id });
            expect(groups).toHaveLength(3); // Default groups
        });
    });

    describe('updateProject', () => {
        it('should update project details', async () => {
            const req = mockRequest({
                params: { id: testProject._id.toString() },
                body: { name: 'Updated Project' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await updateProject(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);

            const project = await Project.findById(testProject._id);
            expect(project!.name).toBe('Updated Project');
        });
    });

    describe('deleteProject', () => {
        it('should delete project and related data', async () => {
            const req = mockRequest({
                params: { id: testProject._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await deleteProject(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);

            const project = await Project.findById(testProject._id);
            expect(project).toBeNull();

            const members = await ProjectMember.find({ projectId: testProject._id });
            expect(members).toHaveLength(0);
        });
    });

    describe('addProjectMember', () => {
        it('should add a member to the project', async () => {
            const newUser = await createTestUser({ email: 'new@example.com', username: 'newuser' });
            const req = mockRequest({
                params: { id: testProject._id.toString() },
                body: { userId: newUser._id.toString(), role: 'member' },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await addProjectMember(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            expect(res.status).toHaveBeenCalledWith(201);

            const member = await ProjectMember.findOne({ projectId: testProject._id, userId: newUser._id });
            expect(member).toBeDefined();
            expect(member!.role).toBe('member');
        });
    });

    describe('removeProjectMember', () => {
        it('should remove a member from the project', async () => {
            const newUser = await createTestUser({ email: 'new@example.com', username: 'newuser' });
            await ProjectMember.create({
                projectId: testProject._id,
                userId: newUser._id,
                role: 'member',
            });

            const req = mockRequest({
                params: { id: testProject._id.toString(), userId: newUser._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await removeProjectMember(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);

            const member = await ProjectMember.findOne({ projectId: testProject._id, userId: newUser._id });
            expect(member).toBeNull();
        });
    });

    describe('Project Labels', () => {
        let labelColor: any;

        beforeEach(async () => {
            labelColor = await LabelColor.create({ name: 'Red', colorHex: '#FF0000', position: 1 });
        });

        it('should create a project label', async () => {
            const req = mockRequest({
                params: { id: testProject._id.toString() },
                body: { name: 'Bug', labelColorId: labelColor._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await createProjectLabel(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            expect(res.status).toHaveBeenCalledWith(201);

            const label = await ProjectLabel.findOne({ projectId: testProject._id, name: 'Bug' });
            expect(label).toBeDefined();
        });

        it('should get project labels', async () => {
            await ProjectLabel.create({
                projectId: testProject._id,
                name: 'Bug',
                labelColorId: labelColor._id,
            });

            const req = mockRequest({
                params: { id: testProject._id.toString() },
                user: testUser,
            });
            const res = mockResponse();
            const next = mockNext();

            await getProjectLabels(req, res, next);

            expect(isSuccessResponse(res)).toBe(true);
            const data = res.json.mock.calls[0][0].data;
            expect(data).toHaveLength(1);
            expect(data[0].name).toBe('Bug');
        });
    });
});
