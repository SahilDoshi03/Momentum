import { Task } from '../models/Task';
import { TaskGroup } from '../models/TaskGroup';
import { Project } from '../models/Project';
import { socketService } from './socket';

export const initChangeStreams = () => {
    // Watch Tasks
    const taskStream = Task.watch();
    taskStream.on('change', async (change) => {
        console.log('Task change detected:', change.operationType);

        if (change.operationType === 'insert' || change.operationType === 'update' || change.operationType === 'replace') {
            // NOTE: Deletes are handled in the controller to ensure we have the taskGroupId context
            const task = await Task.findById(change.documentKey._id);
            if (task) {
                const taskGroup = await TaskGroup.findById(task.taskGroupId);
                if (taskGroup) {
                    console.log(`Emitting task_updated to project: ${taskGroup.projectId}`);
                    socketService.emitToProject(taskGroup.projectId.toString(), 'task_updated', {
                        taskId: task._id,
                        projectId: taskGroup.projectId,
                        listId: task.taskGroupId,
                        operation: change.operationType,
                        data: task
                    });
                }
            }
        }
    });

    // Watch TaskGroups (e.g. for reordering groups)
    const taskGroupStream = TaskGroup.watch();
    taskGroupStream.on('change', (change) => {
        if (change.operationType === 'insert' || change.operationType === 'update' || change.operationType === 'replace') {
            // NOTE: Deletes are handled in the controller
            const docId = (change.documentKey as any)._id;
            TaskGroup.findById(docId).then(tg => {
                if (tg) {
                    console.log(`Emitting task_updated (group) to project: ${tg.projectId}`);
                    socketService.emitToProject(tg.projectId.toString(), 'task_updated', {
                        type: 'group',
                        projectId: tg.projectId,
                        operation: change.operationType,
                        data: tg
                    });
                }
            });
        }
    });

    // Watch Projects
    const projectStream = Project.watch();
    projectStream.on('change', (change) => {
        if (change.operationType === 'update') {
            console.log(`Emitting project_updated to project: ${(change.documentKey as any)._id}`);
            socketService.emitToProject((change.documentKey as any)._id, 'project_updated', {
                projectId: (change.documentKey as any)._id,
                operation: change.operationType
            });
        }
    });

    console.log('MongoDB Change Streams initialized.');
};
