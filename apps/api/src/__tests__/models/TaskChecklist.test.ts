import { TaskChecklist } from '../../models/TaskChecklist';
import { createTestUser, createTestProject, createTestTaskGroup, createTestTask } from '../utils/testHelpers';

describe('TaskChecklist Model', () => {
    let testTaskId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        const testProject = await createTestProject(testUser._id.toString());
        const testTaskGroup = await createTestTaskGroup(testProject._id.toString());
        const testTask = await createTestTask(testTaskGroup._id.toString());
        testTaskId = testTask._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a task checklist with valid data', async () => {
            const checklistData = {
                taskId: testTaskId,
                name: 'Test Checklist',
                position: 1,
            };

            const checklist = new TaskChecklist(checklistData);
            await checklist.save();

            expect(checklist._id).toBeDefined();
            expect(checklist.taskId).toBe(testTaskId);
            expect(checklist.name).toBe('Test Checklist');
            expect(checklist.position).toBe(1);
            expect(checklist.createdAt).toBeDefined();
            expect(checklist.createdAt).toBeDefined();
        });

        it('should require taskId', async () => {
            const checklist = new TaskChecklist({
                name: 'Test Checklist',
            });

            await expect(checklist.save()).rejects.toThrow();
        });

        it('should require name', async () => {
            const checklist = new TaskChecklist({
                taskId: testTaskId,
            });

            await expect(checklist.save()).rejects.toThrow();
        });

        it('should enforce maximum name length', async () => {
            const longName = 'a'.repeat(201); // Max is 200

            const checklist = new TaskChecklist({
                taskId: testTaskId,
                name: longName,
            });

            await expect(checklist.save()).rejects.toThrow();
        });
    });
});
