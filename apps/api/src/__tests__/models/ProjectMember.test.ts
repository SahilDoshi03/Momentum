import { ProjectMember } from '../../models/ProjectMember';
import { createTestUser, createTestProject } from '../utils/testHelpers';

describe('ProjectMember Model', () => {
    let testUserId: string;
    let testProjectId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        testUserId = testUser._id.toString();
        const testProject = await createTestProject(testUserId);
        testProjectId = testProject._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a project member with valid data', async () => {
            const newMember = await createTestUser();
            const projectMemberData = {
                projectId: testProjectId,
                userId: newMember._id.toString(),
                role: 'member',
            };

            const projectMember = new ProjectMember(projectMemberData);
            await projectMember.save();

            expect(projectMember._id).toBeDefined();
            expect(projectMember.projectId).toBe(testProjectId);
            expect(projectMember.userId).toBe(newMember._id.toString());
            expect(projectMember.role).toBe('member');
            expect(projectMember.addedAt).toBeDefined();
        });

        it('should require projectId', async () => {
            const projectMember = new ProjectMember({
                userId: testUserId,
            });

            await expect(projectMember.save()).rejects.toThrow();
        });

        it('should require userId', async () => {
            const projectMember = new ProjectMember({
                projectId: testProjectId,
            });

            await expect(projectMember.save()).rejects.toThrow();
        });

        it('should enforce valid role', async () => {
            const projectMember = new ProjectMember({
                projectId: testProjectId,
                userId: testUserId,
                role: 'invalid-role',
            });

            await expect(projectMember.save()).rejects.toThrow();
        });

        it('should enforce unique user in project', async () => {
            const newMember = await createTestUser();
            const projectMemberData = {
                projectId: testProjectId,
                userId: newMember._id.toString(),
            };

            await new ProjectMember(projectMemberData).save();

            const duplicateMember = new ProjectMember(projectMemberData);

            await expect(duplicateMember.save()).rejects.toThrow();
        });
    });
});
