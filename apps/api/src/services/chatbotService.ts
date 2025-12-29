import { generateText, tool as aiTool } from 'ai';
const tool = (args: any) => aiTool(args);
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import {
    Project,
    TaskGroup,
    Task,
    ProjectMember,
} from '../models';
import { AppError } from '../middleware';
import { config } from '../config';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatbotContext {
    userId: string;
    userEmail: string;
}

/**
 * Tool definitions for the chatbot
 */
export const createChatbotTools = (context: ChatbotContext) => ({
    list_projects: tool({
        description: 'Get all projects that the user has access to',
        parameters: z.object({}),
        execute: async () => {
            const projectMembers = await ProjectMember.find({ userId: context.userId })
                .populate('projectId');

            const projects = projectMembers.map(pm => {
                const project = (pm.projectId as any);
                return {
                    id: project._id.toString(),
                    name: project.name,
                    role: pm.role,
                    createdAt: project.createdAt,
                };
            });

            return { projects };
        },
    }),

    create_project: tool({
        description: 'Create a new project for the user',
        parameters: z.object({
            name: z.string().describe('The name of the project to create'),
            teamId: z.string().optional().describe('Optional team ID to associate the project with'),
        }),
        execute: async ({ name, teamId }: { name: string; teamId?: string }) => {
            const project = new Project({
                name,
                teamId: teamId || null,
            });
            await project.save();

            // Add user as owner
            const projectMember = new ProjectMember({
                projectId: project._id,
                userId: context.userId,
                role: 'owner',
            });
            await projectMember.save();

            // Create default task groups
            const defaultGroups = ['To Do', 'In Progress', 'Done'];
            for (let i = 0; i < defaultGroups.length; i++) {
                const taskGroup = new TaskGroup({
                    projectId: project._id,
                    name: defaultGroups[i],
                    position: i,
                });
                await taskGroup.save();
            }

            return {
                success: true,
                project: {
                    id: project._id.toString(),
                    name: project.name,
                },
            };
        },
    }),

    delete_project: tool({
        description: 'Delete a project by ID. User must be the owner.',
        parameters: z.object({
            projectId: z.string().describe('The ID of the project to delete'),
        }),
        execute: async ({ projectId }: { projectId: string }) => {
            const projectMember = await ProjectMember.findOne({
                projectId,
                userId: context.userId,
            });

            if (!projectMember) {
                throw new AppError('Project not found or access denied', 404);
            }

            if (projectMember.role !== 'owner') {
                throw new AppError('Only project owners can delete projects', 403);
            }

            // Delete all related data
            await TaskGroup.deleteMany({ projectId });
            await Task.deleteMany({ taskGroupId: { $in: await TaskGroup.find({ projectId }).distinct('_id') } });
            await ProjectMember.deleteMany({ projectId });
            await Project.findByIdAndDelete(projectId);

            return {
                success: true,
                message: `Project deleted successfully`,
            };
        },
    }),

    list_task_groups: tool({
        description: 'Get all task groups (lists) for a specific project',
        parameters: z.object({
            projectId: z.string().describe('The ID of the project'),
        }),
        execute: async ({ projectId }: { projectId: string }) => {
            const projectMember = await ProjectMember.findOne({
                projectId,
                userId: context.userId,
            });

            if (!projectMember) {
                throw new AppError('Project not found or access denied', 404);
            }

            const taskGroups = await TaskGroup.find({ projectId }).sort({ position: 1 });

            return {
                taskGroups: taskGroups.map(tg => ({
                    id: tg._id.toString(),
                    name: tg.name,
                    position: tg.position,
                })),
            };
        },
    }),

    create_task_group: tool({
        description: 'Create a new task group (list) in a project',
        parameters: z.object({
            projectId: z.string().describe('The ID of the project'),
            name: z.string().describe('The name of the task group'),
            position: z.number().optional().describe('Optional position in the list'),
        }),
        execute: async ({ projectId, name, position }: { projectId: string; name: string; position?: number }) => {
            const projectMember = await ProjectMember.findOne({
                projectId,
                userId: context.userId,
            });

            if (!projectMember) {
                throw new AppError('Project not found or access denied', 404);
            }

            let groupPosition = position;
            if (groupPosition === undefined) {
                const lastGroup = await TaskGroup.findOne({ projectId }).sort({ position: -1 });
                groupPosition = lastGroup ? lastGroup.position + 1 : 0;
            }

            const taskGroup = new TaskGroup({
                projectId,
                name,
                position: groupPosition,
            });
            await taskGroup.save();

            return {
                success: true,
                taskGroup: {
                    id: taskGroup._id.toString(),
                    name: taskGroup.name,
                    position: taskGroup.position,
                },
            };
        },
    }),

    update_task_group: tool({
        description: 'Update a task group name or position',
        parameters: z.object({
            taskGroupId: z.string().describe('The ID of the task group'),
            name: z.string().optional().describe('New name for the task group'),
            position: z.number().optional().describe('New position for the task group'),
        }),
        execute: async ({ taskGroupId, name, position }: { taskGroupId: string; name?: string; position?: number }) => {
            const taskGroup = await TaskGroup.findById(taskGroupId);
            if (!taskGroup) {
                throw new AppError('Task group not found', 404);
            }

            const projectMember = await ProjectMember.findOne({
                projectId: taskGroup.projectId,
                userId: context.userId,
            });

            if (!projectMember) {
                throw new AppError('Access denied', 403);
            }

            if (name !== undefined) taskGroup.name = name;
            if (position !== undefined) taskGroup.position = position;

            await taskGroup.save();

            return {
                success: true,
                taskGroup: {
                    id: taskGroup._id.toString(),
                    name: taskGroup.name,
                    position: taskGroup.position,
                },
            };
        },
    }),

    list_tasks: tool({
        description: 'Get all tasks from a task group',
        parameters: z.object({
            taskGroupId: z.string().describe('The ID of the task group'),
        }),
        execute: async ({ taskGroupId }: { taskGroupId: string }) => {
            const taskGroup = await TaskGroup.findById(taskGroupId);
            if (!taskGroup) {
                throw new AppError('Task group not found', 404);
            }

            const projectMember = await ProjectMember.findOne({
                projectId: taskGroup.projectId,
                userId: context.userId,
            });

            if (!projectMember) {
                throw new AppError('Access denied', 403);
            }

            const tasks = await Task.find({ taskGroupId }).sort({ position: 1 });

            return {
                tasks: tasks.map(task => ({
                    id: task._id.toString(),
                    name: task.name,
                    description: task.description,
                    complete: task.complete,
                    dueDate: task.dueDate,
                    position: task.position,
                })),
            };
        },
    }),

    create_task: tool({
        description: 'Create a new task in a task group',
        parameters: z.object({
            taskGroupId: z.string().describe('The ID of the task group'),
            name: z.string().describe('The name of the task'),
            description: z.string().optional().describe('Optional description'),
            dueDate: z.string().optional().describe('Optional due date in ISO format'),
        }),
        execute: async ({ taskGroupId, name, description, dueDate }: { taskGroupId: string; name: string; description?: string; dueDate?: string }) => {
            const taskGroup = await TaskGroup.findById(taskGroupId);
            if (!taskGroup) {
                throw new AppError('Task group not found', 404);
            }

            const projectMember = await ProjectMember.findOne({
                projectId: taskGroup.projectId,
                userId: context.userId,
            });

            if (!projectMember) {
                throw new AppError('Access denied', 403);
            }

            const lastTask = await Task.findOne({ taskGroupId }).sort({ position: -1 });
            const position = lastTask ? lastTask.position + 1 : 0;

            const task = new Task({
                taskGroupId,
                name,
                description: description || '',
                dueDate: dueDate ? new Date(dueDate) : null,
                position,
                createdBy: context.userId,
                updatedBy: context.userId,
            });

            await task.save();

            // Auto-assign to creator
            if (['owner', 'admin', 'member'].includes(projectMember.role)) {
                task.assigned.push({
                    userId: context.userId,
                    assignedDate: new Date(),
                } as any);
                await task.save();
            }

            return {
                success: true,
                task: {
                    id: task._id.toString(),
                    name: task.name,
                    description: task.description,
                    complete: task.complete,
                },
            };
        },
    }),

    update_task: tool({
        description: 'Update a task (name, description, completion status, due date)',
        parameters: z.object({
            taskId: z.string().describe('The ID of the task'),
            name: z.string().optional().describe('New name'),
            description: z.string().optional().describe('New description'),
            complete: z.boolean().optional().describe('Mark as complete or incomplete'),
            dueDate: z.string().optional().describe('New due date in ISO format'),
        }),
        execute: async ({ taskId, name, description, complete, dueDate }: { taskId: string; name?: string; description?: string; complete?: boolean; dueDate?: string }) => {
            const task = await Task.findById(taskId);
            if (!task) {
                throw new AppError('Task not found', 404);
            }

            const taskGroup = await TaskGroup.findById(task.taskGroupId);
            if (!taskGroup) {
                throw new AppError('Task group not found', 404);
            }

            const projectMember = await ProjectMember.findOne({
                projectId: taskGroup.projectId,
                userId: context.userId,
            });

            if (!projectMember) {
                throw new AppError('Access denied', 403);
            }

            if (name !== undefined) task.name = name;
            if (description !== undefined) task.description = description;
            if (complete !== undefined) task.complete = complete;
            if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;

            (task as any).updatedBy = context.userId;
            await task.save();

            return {
                success: true,
                task: {
                    id: task._id.toString(),
                    name: task.name,
                    complete: task.complete,
                },
            };
        },
    }),

    delete_task: tool({
        description: 'Delete a task by ID',
        parameters: z.object({
            taskId: z.string().describe('The ID of the task to delete'),
        }),
        execute: async ({ taskId }: { taskId: string }) => {
            const task = await Task.findById(taskId);
            if (!task) {
                throw new AppError('Task not found', 404);
            }

            const taskGroup = await TaskGroup.findById(task.taskGroupId);
            if (!taskGroup) {
                throw new AppError('Task group not found', 404);
            }

            const projectMember = await ProjectMember.findOne({
                projectId: taskGroup.projectId,
                userId: context.userId,
            });

            if (!projectMember || !['owner', 'admin', 'member'].includes(projectMember.role)) {
                throw new AppError('Access denied', 403);
            }

            await Task.findByIdAndDelete(taskId);

            return {
                success: true,
                message: 'Task deleted successfully',
            };
        },
    }),

    get_my_tasks: tool({
        description: 'Get all tasks assigned to the current user',
        parameters: z.object({
            includeCompleted: z.boolean().optional().describe('Whether to include completed tasks'),
        }),
        execute: async ({ includeCompleted = false }: { includeCompleted?: boolean }) => {
            const query: any = { 'assigned.userId': context.userId };
            if (!includeCompleted) {
                query.complete = false;
            }

            const tasks = await Task.find(query)
                .populate('taskGroupId', 'name projectId')
                .sort({ createdAt: -1 });

            return {
                tasks: tasks.map(task => ({
                    id: task._id.toString(),
                    name: task.name,
                    description: task.description,
                    complete: task.complete,
                    dueDate: task.dueDate,
                    taskGroup: (task.taskGroupId as any)?.name,
                })),
            };
        },
    }),
});

/**
 * Process a chat message with the AI chatbot
 */
export async function processChatMessage(
    message: string,
    context: ChatbotContext,
    conversationHistory: ChatMessage[] = []
): Promise<{ response: string; toolResults?: any[] }> {
    // Validate API key is configured
    if (!config.geminiApiKey) {
        throw new AppError(
            'Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.',
            500
        );
    }

    const tools = createChatbotTools(context);

    const messages = [
        ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
        {
            role: 'user' as const,
            content: message,
        },
    ];

    const google = createGoogleGenerativeAI({
        apiKey: config.geminiApiKey,
    });

    const result = await generateText({
        model: google('gemini-flash-latest'),
        messages,
        tools,
        system: `You are a helpful assistant for the Momentum task management app. 
You can help users manage their projects, task groups (lists), and tasks.

When users ask to create, update, or delete items, use the appropriate tools.
Be conversational and friendly. When you perform actions, confirm what you did.
If you need more information to complete a request, ask the user.

Current user: ${context.userEmail}`,
        // maxSteps: 5, // Allow multiple tool calls in sequence
    });

    return {
        response: result.text,
        toolResults: result.toolResults,
    };
}
