import { TaskAssigned } from '../../models/TaskAssigned';
import { createTestUser, createTestProject, createTestTaskGroup, createTestTask } from '../utils/testHelpers';

describe('TaskAssigned Model', () => {
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
        it('should create a task assignment with valid data', async () => {
            const taskAssignedData = {
                taskId: testTaskId,
                userId: testUserId,
            };

            const taskAssigned = new TaskAssigned(taskAssignedData);
            await taskAssigned.save();

            expect(taskAssigned._id).toBeDefined();
            expect(taskAssigned.taskId).toBe(testTaskId);
            expect(taskAssigned.userId).toBe(testUserId);
            expect(taskAssigned.assignedDate).toBeDefined();
        });

        it('should require taskId', async () => {
            const taskAssigned = new TaskAssigned({
                userId: testUserId,
            });

            await expect(taskAssigned.save()).rejects.toThrow();
        });

        it('should require userId', async () => {
            const taskAssigned = new TaskAssigned({
                taskId: testTaskId,
            });

            await expect(taskAssigned.save()).rejects.toThrow();
        });

        it('should enforce unique assignment', async () => {
            const taskAssignedData = {
                taskId: testTaskId,
                userId: testUserId,
            };

            await new TaskAssigned(taskAssignedData).save();

            const duplicateAssignment = new TaskAssigned(taskAssignedData);

            await expect(duplicateAssignment.save()).rejects.toThrow();
        });
    });
});
