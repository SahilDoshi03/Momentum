import { TaskGroup } from '../../models/TaskGroup';
import { createTestUser, createTestProject } from '../utils/testHelpers';

describe('TaskGroup Model', () => {
    let testProjectId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        const testProject = await createTestProject(testUser._id.toString());
        testProjectId = testProject._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a task group with valid data', async () => {
            const taskGroupData = {
                projectId: testProjectId,
                name: 'To Do',
                position: 0,
            };

            const taskGroup = new TaskGroup(taskGroupData);
            await taskGroup.save();

            expect(taskGroup._id).toBeDefined();
            expect(taskGroup.projectId).toBe(testProjectId);
            expect(taskGroup.name).toBe('To Do');
            expect(taskGroup.position).toBe(0);
            expect(taskGroup.createdAt).toBeDefined();
            expect(taskGroup.createdAt).toBeDefined();
        });

        it('should require projectId', async () => {
            const taskGroup = new TaskGroup({
                name: 'To Do',
            });

            await expect(taskGroup.save()).rejects.toThrow();
        });

        it('should require name', async () => {
            const taskGroup = new TaskGroup({
                projectId: testProjectId,
            });

            await expect(taskGroup.save()).rejects.toThrow();
        });

        it('should enforce maximum name length', async () => {
            const longName = 'a'.repeat(101); // Max is 100

            const taskGroup = new TaskGroup({
                projectId: testProjectId,
                name: longName,
            });

            await expect(taskGroup.save()).rejects.toThrow();
        });
    });
});
