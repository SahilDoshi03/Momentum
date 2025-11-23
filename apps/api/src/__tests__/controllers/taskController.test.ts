import request from 'supertest';
import express, { Application } from 'express';
import {
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    getMyTasks,
    assignUserToTask,
    unassignUserFromTask,
} from '../../controllers/taskController';
import {
    createTestUser,
    createTestProject,
    createTestTaskGroup,
    createTestTask,
    assignUserToTask as assignUserHelper,
    mockRequest,
    mockResponse,
    mockNext,
} from '../utils/testHelpers';
import { Task, TaskAssigned, ProjectMember } from '../../models';

describe('Task Controller', () => {
    let app: Application;
    let testUser: any;
    let testProject: any;
    let testTaskGroup: any;

    beforeAll(() => {
        // Create a minimal Express app for testing
        app = express();
        app.use(express.json());
    });

    beforeEach(async () => {
        // Create test data
        testUser = await createTestUser();
        testProject = await createTestProject(testUser._id);
        testTaskGroup = await createTestTaskGroup(testProject._id);
    });

    describe('createTask', () => {
        it('should create a new task successfully', async () => {
            const req = mockRequest({
                user: testUser,
                body: {
                    taskGroupId: testTaskGroup._id,
                    name: 'New Test Task',
                    description: 'Task description',
                    dueDate: new Date().toISOString(),
                    hasTime: false,
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await createTask(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Task created successfully',
                    data: expect.objectContaining({
                        name: 'New Test Task',
                        description: 'Task description',
                    }),
                })
            );

            // Verify task was created in database
            const task = await Task.findOne({ name: 'New Test Task' });
            expect(task).toBeTruthy();
            expect(task?.taskGroupId).toBe(testTaskGroup._id);
        });

        it('should assign creator to task if they have member role', async () => {
            const req = mockRequest({
                user: testUser,
                body: {
                    taskGroupId: testTaskGroup._id,
                    name: 'Task with Assignment',
                    description: 'Test',
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await createTask(req, res, next);

            const task = await Task.findOne({ name: 'Task with Assignment' });
            const assignment = await TaskAssigned.findOne({
                taskId: task?._id,
                userId: testUser._id,
            });

            expect(assignment).toBeTruthy();
        });

        it('should return 404 if task group not found', async () => {
            const req = mockRequest({
                user: testUser,
                body: {
                    taskGroupId: '507f1f77bcf86cd799439011', // Non-existent ID
                    name: 'Test Task',
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await createTask(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    message: 'Task group not found',
                })
            );
        });

        it('should return 403 if user not authorized', async () => {
            const unauthorizedUser = await createTestUser({
                email: 'unauthorized@example.com',
                username: 'unauthorized',
            });

            const req = mockRequest({
                user: unauthorizedUser,
                body: {
                    taskGroupId: testTaskGroup._id,
                    name: 'Unauthorized Task',
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await createTask(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    message: 'Not authorized to create tasks in this project',
                })
            );
        });
    });

    describe('getTaskById', () => {
        it('should get task by ID successfully', async () => {
            const task = await createTestTask(testTaskGroup._id);

            const req = mockRequest({
                user: testUser,
                params: { id: task._id },
            });
            const res = mockResponse();
            const next = mockNext();

            await getTaskById(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        _id: task._id,
                        name: task.name,
                    }),
                })
            );
        });

        it('should return 404 if task not found', async () => {
            const req = mockRequest({
                user: testUser,
                params: { id: '507f1f77bcf86cd799439011' },
            });
            const res = mockResponse();
            const next = mockNext();

            await getTaskById(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    message: 'Task not found',
                })
            );
        });

        it('should return 403 if user not authorized', async () => {
            const task = await createTestTask(testTaskGroup._id);
            const unauthorizedUser = await createTestUser({
                email: 'unauthorized@example.com',
                username: 'unauthorized',
            });

            const req = mockRequest({
                user: unauthorizedUser,
                params: { id: task._id },
            });
            const res = mockResponse();
            const next = mockNext();

            await getTaskById(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    message: 'Not authorized to view this task',
                })
            );
        });
    });

    describe('updateTask', () => {
        it('should update task successfully', async () => {
            const task = await createTestTask(testTaskGroup._id);

            const req = mockRequest({
                user: testUser,
                params: { id: task._id },
                body: {
                    name: 'Updated Task Name',
                    complete: true,
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await updateTask(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Task updated successfully',
                    data: expect.objectContaining({
                        name: 'Updated Task Name',
                        complete: true,
                    }),
                })
            );

            // Verify in database
            const updatedTask = await Task.findById(task._id);
            expect(updatedTask?.name).toBe('Updated Task Name');
            expect(updatedTask?.complete).toBe(true);
            expect(updatedTask?.completedAt).toBeTruthy();
        });

        it('should only update allowed fields', async () => {
            const task = await createTestTask(testTaskGroup._id);
            const originalShortId = task.shortId;

            const req = mockRequest({
                user: testUser,
                params: { id: task._id },
                body: {
                    name: 'Updated Name',
                    shortId: 'HACKED', // Should not be updated
                    createdAt: new Date(), // Should not be updated
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await updateTask(req, res, next);

            const updatedTask = await Task.findById(task._id);
            expect(updatedTask?.name).toBe('Updated Name');
            expect(updatedTask?.shortId).toBe(originalShortId); // Should remain unchanged
        });
    });

    describe('deleteTask', () => {
        it('should delete task successfully', async () => {
            const task = await createTestTask(testTaskGroup._id);
            await assignUserHelper(task._id, testUser._id);

            const req = mockRequest({
                user: testUser,
                params: { id: task._id },
            });
            const res = mockResponse();
            const next = mockNext();

            await deleteTask(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Task deleted successfully',
                })
            );

            // Verify task and related data are deleted
            const deletedTask = await Task.findById(task._id);
            const assignments = await TaskAssigned.find({ taskId: task._id });

            expect(deletedTask).toBeNull();
            expect(assignments).toHaveLength(0);
        });

        it('should return 403 if user does not have permission', async () => {
            const task = await createTestTask(testTaskGroup._id);

            // Create user with observer role
            const observerUser = await createTestUser({
                email: 'observer@example.com',
                username: 'observer',
            });

            await ProjectMember.create({
                projectId: testProject._id,
                userId: observerUser._id,
                role: 'observer',
            });

            const req = mockRequest({
                user: observerUser,
                params: { id: task._id },
            });
            const res = mockResponse();
            const next = mockNext();

            await deleteTask(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    message: 'Not authorized to delete this task',
                })
            );
        });
    });

    describe('getMyTasks', () => {
        it('should get all tasks assigned to user', async () => {
            const task1 = await createTestTask(testTaskGroup._id, { name: 'Task 1' });
            const task2 = await createTestTask(testTaskGroup._id, { name: 'Task 2' });

            await assignUserHelper(task1._id, testUser._id);
            await assignUserHelper(task2._id, testUser._id);

            const req = mockRequest({
                user: testUser,
                query: {},
            });
            const res = mockResponse();
            const next = mockNext();

            await getMyTasks(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        tasks: expect.arrayContaining([
                            expect.objectContaining({ name: 'Task 1' }),
                            expect.objectContaining({ name: 'Task 2' }),
                        ]),
                    }),
                })
            );
        });

        it('should filter incomplete tasks', async () => {
            const incompleteTask = await createTestTask(testTaskGroup._id, {
                name: 'Incomplete',
                complete: false,
            });
            const completeTask = await createTestTask(testTaskGroup._id, {
                name: 'Complete',
                complete: true,
            });

            await assignUserHelper(incompleteTask._id, testUser._id);
            await assignUserHelper(completeTask._id, testUser._id);

            const req = mockRequest({
                user: testUser,
                query: { status: 'INCOMPLETE' },
            });
            const res = mockResponse();
            const next = mockNext();

            await getMyTasks(req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.data.tasks).toHaveLength(1);
            expect(response.data.tasks[0].name).toBe('Incomplete');
        });

        it('should sort tasks by due date', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            const task1 = await createTestTask(testTaskGroup._id, {
                name: 'Due Next Week',
                dueDate: nextWeek,
            });
            const task2 = await createTestTask(testTaskGroup._id, {
                name: 'Due Tomorrow',
                dueDate: tomorrow,
            });

            await assignUserHelper(task1._id, testUser._id);
            await assignUserHelper(task2._id, testUser._id);

            const req = mockRequest({
                user: testUser,
                query: { sort: 'DUE_DATE' },
            });
            const res = mockResponse();
            const next = mockNext();

            await getMyTasks(req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.data.tasks[0].name).toBe('Due Tomorrow');
            expect(response.data.tasks[1].name).toBe('Due Next Week');
        });
    });

    describe('assignUserToTask', () => {
        it('should assign user to task successfully', async () => {
            const task = await createTestTask(testTaskGroup._id);
            const userToAssign = await createTestUser({
                email: 'assign@example.com',
                username: 'assignuser',
            });

            // Add user to project
            await ProjectMember.create({
                projectId: testProject._id,
                userId: userToAssign._id,
                role: 'member',
            });

            const req = mockRequest({
                user: testUser,
                params: { id: task._id },
                body: { userId: userToAssign._id },
            });
            const res = mockResponse();
            const next = mockNext();

            await assignUserToTask(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'User assigned to task successfully',
                })
            );

            // Verify assignment in database
            const assignment = await TaskAssigned.findOne({
                taskId: task._id,
                userId: userToAssign._id,
            });
            expect(assignment).toBeTruthy();
        });

        it('should return 400 if user already assigned', async () => {
            const task = await createTestTask(testTaskGroup._id);
            await assignUserHelper(task._id, testUser._id);

            const req = mockRequest({
                user: testUser,
                params: { id: task._id },
                body: { userId: testUser._id },
            });
            const res = mockResponse();
            const next = mockNext();

            await assignUserToTask(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    message: 'User is already assigned to this task',
                })
            );
        });
    });

    describe('unassignUserFromTask', () => {
        it('should unassign user from task successfully', async () => {
            const task = await createTestTask(testTaskGroup._id);
            await assignUserHelper(task._id, testUser._id);

            const req = mockRequest({
                user: testUser,
                params: { id: task._id, userId: testUser._id },
            });
            const res = mockResponse();
            const next = mockNext();

            await unassignUserFromTask(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'User unassigned from task successfully',
                })
            );

            // Verify assignment removed
            const assignment = await TaskAssigned.findOne({
                taskId: task._id,
                userId: testUser._id,
            });
            expect(assignment).toBeNull();
        });
    });
});
