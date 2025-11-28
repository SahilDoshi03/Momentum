import { TaskChecklistItem } from '../../models/TaskChecklistItem';
import { TaskChecklist } from '../../models/TaskChecklist';
import { createTestUser, createTestProject, createTestTaskGroup, createTestTask } from '../utils/testHelpers';

describe('TaskChecklistItem Model', () => {
    let testChecklistId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        const testProject = await createTestProject(testUser._id.toString());
        const testTaskGroup = await createTestTaskGroup(testProject._id.toString());
        const testTask = await createTestTask(testTaskGroup._id.toString());

        const checklist = new TaskChecklist({
            taskId: testTask._id.toString(),
            name: 'Test Checklist',
        });
        await checklist.save();
        testChecklistId = checklist._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a checklist item with valid data', async () => {
            const itemData = {
                checklistId: testChecklistId,
                name: 'Test Item',
                complete: false,
                position: 1,
                dueDate: new Date(),
            };

            const item = new TaskChecklistItem(itemData);
            await item.save();

            expect(item._id).toBeDefined();
            expect(item.checklistId).toBe(testChecklistId);
            expect(item.name).toBe('Test Item');
            expect(item.complete).toBe(false);
            expect(item.position).toBe(1);
            expect(item.dueDate).toBeInstanceOf(Date);
            expect(item.createdAt).toBeDefined();
            expect(item.createdAt).toBeDefined();
        });

        it('should require checklistId', async () => {
            const item = new TaskChecklistItem({
                name: 'Test Item',
            });

            await expect(item.save()).rejects.toThrow();
        });

        it('should require name', async () => {
            const item = new TaskChecklistItem({
                checklistId: testChecklistId,
            });

            await expect(item.save()).rejects.toThrow();
        });

        it('should enforce maximum name length', async () => {
            const longName = 'a'.repeat(201); // Max is 200

            const item = new TaskChecklistItem({
                checklistId: testChecklistId,
                name: longName,
            });

            await expect(item.save()).rejects.toThrow();
        });

        it('should have default values', async () => {
            const item = new TaskChecklistItem({
                checklistId: testChecklistId,
                name: 'Test Item',
            });
            await item.save();

            expect(item.complete).toBe(false);
            expect(item.position).toBe(0);
            expect(item.dueDate).toBeNull();
        });
    });
});
