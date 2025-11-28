import { TaskComment } from '../../models/TaskComment';
import { createTestUser, createTestProject, createTestTaskGroup, createTestTask } from '../utils/testHelpers';

describe('TaskComment Model', () => {
    let testUserId: string;
    let testTaskId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        testUserId = testUser._id.toString();
        const testProject = await createTestProject(testUserId);
        const testTaskGroup = await createTestTaskGroup(testProject._id.toString());
        const testTask = await createTestTask(testTaskGroup._id.toString());
        testTaskId = testTask._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a task comment with valid data', async () => {
            const commentData = {
                taskId: testTaskId,
                userId: testUserId,
                message: 'Test Comment',
                pinned: false,
            };

            const comment = new TaskComment(commentData);
            await comment.save();

            expect(comment._id).toBeDefined();
            expect(comment.taskId).toBe(testTaskId);
            expect(comment.userId).toBe(testUserId);
            expect(comment.message).toBe('Test Comment');
            expect(comment.pinned).toBe(false);
            expect(comment.createdAt).toBeDefined();
            expect(comment.updatedAt).toBeDefined();
        });

        it('should require taskId', async () => {
            const comment = new TaskComment({
                userId: testUserId,
                message: 'Test Comment',
            });

            await expect(comment.save()).rejects.toThrow();
        });

        it('should require userId', async () => {
            const comment = new TaskComment({
                taskId: testTaskId,
                message: 'Test Comment',
            });

            await expect(comment.save()).rejects.toThrow();
        });

        it('should require message', async () => {
            const comment = new TaskComment({
                taskId: testTaskId,
                userId: testUserId,
            });

            await expect(comment.save()).rejects.toThrow();
        });

        it('should enforce maximum message length', async () => {
            const longMessage = 'a'.repeat(2001); // Max is 2000

            const comment = new TaskComment({
                taskId: testTaskId,
                userId: testUserId,
                message: longMessage,
            });

            await expect(comment.save()).rejects.toThrow();
        });
    });
});
