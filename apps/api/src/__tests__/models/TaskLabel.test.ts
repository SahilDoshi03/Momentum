import { TaskLabel } from '../../models/TaskLabel';
import { ProjectLabel } from '../../models/ProjectLabel';
import { LabelColor } from '../../models/LabelColor';
import { createTestUser, createTestProject, createTestTaskGroup, createTestTask } from '../utils/testHelpers';

describe('TaskLabel Model', () => {
    let testTaskId: string;
    let testProjectLabelId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        const testProject = await createTestProject(testUser._id.toString());
        const testTaskGroup = await createTestTaskGroup(testProject._id.toString());
        const testTask = await createTestTask(testTaskGroup._id.toString());
        testTaskId = testTask._id.toString();

        const labelColor = new LabelColor({
            name: 'Red',
            colorHex: '#FF0000',
            position: 1,
        });
        await labelColor.save();

        const projectLabel = new ProjectLabel({
            projectId: testProject._id.toString(),
            name: 'Bug',
            labelColorId: labelColor._id.toString(),
        });
        await projectLabel.save();
        testProjectLabelId = projectLabel._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a task label with valid data', async () => {
            const taskLabelData = {
                taskId: testTaskId,
                projectLabelId: testProjectLabelId,
            };

            const taskLabel = new TaskLabel(taskLabelData);
            await taskLabel.save();

            expect(taskLabel._id).toBeDefined();
            expect(taskLabel.taskId).toBe(testTaskId);
            expect(taskLabel.projectLabelId).toBe(testProjectLabelId);
            expect(taskLabel.assignedDate).toBeDefined();
        });

        it('should require taskId', async () => {
            const taskLabel = new TaskLabel({
                projectLabelId: testProjectLabelId,
            });

            await expect(taskLabel.save()).rejects.toThrow();
        });

        it('should require projectLabelId', async () => {
            const taskLabel = new TaskLabel({
                taskId: testTaskId,
            });

            await expect(taskLabel.save()).rejects.toThrow();
        });

        it('should enforce unique label per task', async () => {
            const taskLabelData = {
                taskId: testTaskId,
                projectLabelId: testProjectLabelId,
            };

            await new TaskLabel(taskLabelData).save();

            const duplicateLabel = new TaskLabel(taskLabelData);

            await expect(duplicateLabel.save()).rejects.toThrow();
        });
    });
});
