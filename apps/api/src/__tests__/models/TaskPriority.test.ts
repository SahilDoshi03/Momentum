import { Task } from '../../models/Task';
import { createTestUser, createTestProject, createTestTaskGroup } from '../utils/testHelpers';

describe('Task Priority', () => {
    let testGroupId: string;
    let testUserId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        testUserId = testUser._id.toString();
        const testProject = await createTestProject(testUserId);
        const testTaskGroup = await createTestTaskGroup(testProject._id.toString());
        testGroupId = testTaskGroup._id.toString();
    });

    it('should default priority to medium', async () => {
        const task = new Task({
            taskGroupId: testGroupId,
            name: 'Default Priority Task',
            position: 1,
            assigned: [{ userId: testUserId }],
            createdBy: testUserId,
            updatedBy: testUserId
        });

        await task.save();
        expect(task.priority).toBe('medium');
    });

    it('should save explicit priority', async () => {
        const task = new Task({
            taskGroupId: testGroupId,
            name: 'High Priority Task',
            position: 2,
            priority: 'high',
            assigned: [{ userId: testUserId }],
            createdBy: testUserId,
            updatedBy: testUserId
        });

        await task.save();
        expect(task.priority).toBe('high');
    });

    it('should update priority', async () => {
        const task = new Task({
            taskGroupId: testGroupId,
            name: 'Update Priority Task',
            position: 3,
            assigned: [{ userId: testUserId }],
            createdBy: testUserId,
            updatedBy: testUserId
        });

        await task.save();
        expect(task.priority).toBe('medium');

        task.priority = 'high';
        await task.save();

        const updatedTask = await Task.findById(task._id);
        expect(updatedTask?.priority).toBe('high');
    });
});
