import { Task } from '../../models/Task';
import { createTestTaskGroup } from '../utils/testHelpers';
import mongoose from 'mongoose';

describe('Task Model', () => {
    let testTaskGroupId: string;

    beforeEach(async () => {
        // Create a test project and task group
        const projectId = new mongoose.Types.ObjectId().toString();
        const taskGroup = await createTestTaskGroup(projectId);
        testTaskGroupId = taskGroup._id;
    });

    describe('Schema Validation', () => {
        it('should create a task with valid data', async () => {
            const taskData = {
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
                description: 'Test description',
                position: 0,
                complete: false,
                hasTime: false,
            };

            const task = new Task(taskData);
            await task.save();

            expect(task._id).toBeDefined();
            expect(task.name).toBe('Test Task');
            expect(task.description).toBe('Test description');
            expect(task.complete).toBe(false);
            expect(task.shortId).toBeDefined();
            expect(task.createdAt).toBeDefined();
            expect(task.updatedAt).toBeDefined();
        });

        it('should require taskGroupId', async () => {
            const task = new Task({
                name: 'Test Task',
            });

            await expect(task.save()).rejects.toThrow();
        });

        it('should require name', async () => {
            const task = new Task({
                taskGroupId: testTaskGroupId,
            });

            await expect(task.save()).rejects.toThrow();
        });

        it('should enforce maximum name length', async () => {
            const longName = 'a'.repeat(201); // Max is 200

            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: longName,
            });

            await expect(task.save()).rejects.toThrow();
        });

        it('should enforce maximum description length', async () => {
            const longDescription = 'a'.repeat(2001); // Max is 2000

            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
                description: longDescription,
            });

            await expect(task.save()).rejects.toThrow();
        });

        it('should auto-generate unique shortId', async () => {
            const task1 = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Task 1',
            });
            await task1.save();

            const task2 = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Task 2',
            });
            await task2.save();

            expect(task1.shortId).toBeDefined();
            expect(task2.shortId).toBeDefined();
            expect(task1.shortId).not.toBe(task2.shortId);
        });
    });

    describe('Default Values', () => {
        it('should set default values correctly', async () => {
            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
            });
            await task.save();

            expect(task.description).toBe('');
            expect(task.position).toBe(0);
            expect(task.complete).toBe(false);
            expect(task.completedAt).toBeUndefined();
            expect(task.dueDate).toBeUndefined();
            expect(task.hasTime).toBe(false);
        });
    });

    describe('Completion Tracking', () => {
        it('should set completedAt when task is marked complete', async () => {
            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
                complete: false,
            });
            await task.save();

            expect(task.completedAt).toBeUndefined();

            task.complete = true;
            await task.save();

            expect(task.completedAt).toBeDefined();
            expect(task.completedAt).toBeInstanceOf(Date);
        });

        it('should clear completedAt when task is marked incomplete', async () => {
            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
                complete: true,
            });
            await task.save();

            expect(task.completedAt).toBeDefined();

            task.complete = false;
            await task.save();

            expect(task.completedAt).toBeUndefined();
        });

        it('should not update completedAt if complete status unchanged', async () => {
            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
                complete: true,
            });
            await task.save();

            const firstCompletedAt = task.completedAt;

            // Wait a bit to ensure timestamp would be different
            await new Promise(resolve => setTimeout(resolve, 10));

            task.name = 'Updated Name';
            await task.save();

            expect(task.completedAt).toEqual(firstCompletedAt);
        });
    });

    describe('Due Date Handling', () => {
        it('should store due date correctly', async () => {
            const dueDate = new Date('2024-12-31');

            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
                dueDate,
                hasTime: false,
            });
            await task.save();

            expect(task.dueDate).toEqual(dueDate);
            expect(task.hasTime).toBe(false);
        });

        it('should handle due date with time', async () => {
            const dueDate = new Date('2024-12-31T14:30:00');

            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
                dueDate,
                hasTime: true,
            });
            await task.save();

            expect(task.dueDate).toEqual(dueDate);
            expect(task.hasTime).toBe(true);
        });
    });

    describe('Indexing', () => {
        it('should enforce unique shortId', async () => {
            const task1 = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Task 1',
            });
            await task1.save();

            const task2 = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Task 2',
                shortId: task1.shortId, // Try to use same shortId
            });

            await expect(task2.save()).rejects.toThrow();
        });
    });

    describe('Timestamps', () => {
        it('should automatically set createdAt and updatedAt', async () => {
            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
            });
            await task.save();

            expect(task.createdAt).toBeDefined();
            expect(task.updatedAt).toBeDefined();
            expect(task.createdAt).toBeInstanceOf(Date);
            expect(task.updatedAt).toBeInstanceOf(Date);
        });

        it('should update updatedAt on modification', async () => {
            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
            });
            await task.save();

            const originalUpdatedAt = task.updatedAt;

            // Wait to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            task.name = 'Updated Task';
            await task.save();

            expect(task.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });

    describe('Assigned Users and Labels', () => {
        it('should initialize with empty assigned array', async () => {
            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
            });
            await task.save();

            expect(task.assigned).toBeDefined();
            expect(Array.isArray(task.assigned)).toBe(true);
            expect(task.assigned).toHaveLength(0);
        });

        it('should initialize with empty labels array', async () => {
            const task = new Task({
                taskGroupId: testTaskGroupId,
                name: 'Test Task',
            });
            await task.save();

            expect(task.labels).toBeDefined();
            expect(Array.isArray(task.labels)).toBe(true);
            expect(task.labels).toHaveLength(0);
        });
    });
});
