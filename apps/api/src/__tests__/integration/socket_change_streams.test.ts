import mongoose from 'mongoose';
import { Task, TaskGroup, Project } from '../../models';
import { initChangeStreams } from '../../services/changeStreams';
import { socketService } from '../../services/socket';

// Mock the socketService
jest.mock('../../services/socket', () => ({
    socketService: {
        emitToProject: jest.fn(),
    },
}));

describe('Integration: Change Streams & Socket Events', () => {
    let projectId: mongoose.Types.ObjectId;

    beforeAll(async () => {
        // Initialize change streams once
        initChangeStreams();
        // Allow some time for watchers to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        // Create a dummy project for testing
        const project = await Project.create({ name: 'Test Project', createdBy: new mongoose.Types.ObjectId() });
        projectId = project._id as unknown as mongoose.Types.ObjectId;
    });

    afterEach(async () => {
        await Project.deleteMany({});
        await TaskGroup.deleteMany({});
        await Task.deleteMany({});
    });

    it('should emit "task_updated" when a task is Created', async () => {
        const group = await TaskGroup.create({ name: 'Group 1', projectId, position: 0 });

        // Create task
        const task = await Task.create({
            name: 'New Task',
            taskGroupId: group._id,
            createdBy: new mongoose.Types.ObjectId(),
            position: 0,
        });

        // Wait for change stream to pick it up
        await new Promise(resolve => setTimeout(resolve, 500));

        expect(socketService.emitToProject).toHaveBeenCalledWith(
            projectId.toString(),
            'task_updated',
            expect.objectContaining({
                taskId: task._id,
                operation: 'insert'
            })
        );
    });

    it('should emit "task_updated" when a task is Updated', async () => {
        const group = await TaskGroup.create({ name: 'Group 1', projectId, position: 0 });
        const task = await Task.create({
            name: 'Original Task',
            taskGroupId: group._id,
            createdBy: new mongoose.Types.ObjectId(),
            position: 0,
        });

        // Clear initial create logs
        jest.clearAllMocks();

        // Update task
        task.name = 'Updated Task';
        await task.save();

        await new Promise(resolve => setTimeout(resolve, 500));

        expect(socketService.emitToProject).toHaveBeenCalledWith(
            projectId.toString(),
            'task_updated',
            expect.objectContaining({
                taskId: task._id,
                operation: 'update'
            })
        );
    });

    it('should emit "task_updated" with operation "delete" when a task is Deleted', async () => {
        const group = await TaskGroup.create({ name: 'Group 1', projectId, position: 0 });
        const task = await Task.create({
            name: 'Task to Delete',
            taskGroupId: group._id,
            createdBy: new mongoose.Types.ObjectId(),
            position: 0,
        });

        jest.clearAllMocks();

        // Delete task
        await Task.findByIdAndDelete(task._id);

        await new Promise(resolve => setTimeout(resolve, 500));

        expect(socketService.emitToProject).toHaveBeenCalledWith(
            projectId.toString(),
            'task_updated',
            expect.objectContaining({
                taskId: task._id,
                projectId: projectId, // Ensure it emits to the correct project
                operation: 'delete'
            })
        );
    });

    it('should emit "task_updated" (group) when a TaskGroup is Deleted', async () => {
        const group = await TaskGroup.create({ name: 'Group to Delete', projectId, position: 0 });

        jest.clearAllMocks();

        await TaskGroup.findByIdAndDelete(group._id);

        await new Promise(resolve => setTimeout(resolve, 500));

        expect(socketService.emitToProject).toHaveBeenCalledWith(
            projectId.toString(),
            'task_updated',
            expect.objectContaining({
                type: 'group',
                projectId: projectId,
                operation: 'delete'
            })
        );
    });
});
