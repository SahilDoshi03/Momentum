import mongoose from 'mongoose';
import { User, Project, Task, TaskGroup, ProjectMember, TaskAssigned } from '../../models';
import bcrypt from 'bcryptjs';

/**
 * Test helper utilities for creating test data with real database operations
 * Uses MongoDB Memory Server for fast, isolated testing
 */

// User factory - creates a real user in the database
export const createTestUser = async (overrides: Partial<any> = {}) => {
    const timestamp = Date.now();
    const userData = {
        email: overrides.email || `test${timestamp}@example.com`,
        username: overrides.username || `testuser${timestamp}`,
        password: await bcrypt.hash('password123', 10),
        fullName: overrides.fullName || 'Test User',
        initials: overrides.initials || 'TU',
        bio: overrides.bio || 'Test bio',
        role: overrides.role || 'member',
        active: overrides.active !== undefined ? overrides.active : true,
        profileIcon: overrides.profileIcon || {
            initials: 'TU',
            bgColor: '#3b82f6',
        },
        ...overrides,
    };

    const user = await User.create(userData);
    return user;
};

// Project factory - creates a real project with owner membership
export const createTestProject = async (userId: string, overrides: Partial<any> = {}) => {
    const timestamp = Date.now();
    // Generate a short ID that's max 10 characters
    const shortId = overrides.shortId || `TP${timestamp.toString().slice(-7)}`;

    const projectData = {
        name: overrides.name || `Test Project ${timestamp}`,
        shortId,
        description: overrides.description || 'Test project description',
        ...overrides,
    };

    const project = await Project.create(projectData);

    // Create project membership for the owner
    await ProjectMember.create({
        projectId: project._id,
        userId,
        role: overrides.memberRole || 'owner',
    });

    return project;
};

// Task Group factory - creates a real task group in the database
export const createTestTaskGroup = async (projectId: string, overrides: Partial<any> = {}) => {
    const timestamp = Date.now();
    const taskGroupData = {
        projectId,
        name: overrides.name || `Test Task Group ${timestamp}`,
        position: overrides.position !== undefined ? overrides.position : 0,
        ...overrides,
    };

    const taskGroup = await TaskGroup.create(taskGroupData);
    return taskGroup;
};

// Task factory - creates a real task in the database
export const createTestTask = async (taskGroupId: string, overrides: Partial<any> = {}) => {
    const timestamp = Date.now();
    const taskData = {
        taskGroupId,
        name: overrides.name || `Test Task ${timestamp}`,
        description: overrides.description || 'Test task description',
        position: overrides.position !== undefined ? overrides.position : 0,
        complete: overrides.complete !== undefined ? overrides.complete : false,
        hasTime: overrides.hasTime !== undefined ? overrides.hasTime : false,
        dueDate: overrides.dueDate,
        assigned: overrides.assigned || [],
        labels: overrides.labels || [],
        ...overrides,
    };

    const task = await Task.create(taskData);
    return task;
};

// Assign user to task - creates a real task assignment
export const assignUserToTask = async (taskId: string, userId: string) => {
    const taskAssigned = await TaskAssigned.create({
        taskId,
        userId,
        assignedDate: new Date(),
    });

    return taskAssigned;
};

// Helper to clear all collections (useful for cleanup)
export const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};

// Mock Express Request
export const mockRequest = (overrides: Partial<any> = {}) => {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        cookies: {},
        user: null,
        ...overrides,
    } as any;
};

// Mock Express Response
export const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendStatus = jest.fn().mockReturnValue(res);
    return res;
};

// Mock Next Function
export const mockNext = () => jest.fn();

// Helper to extract error message from response
export const getErrorMessage = (res: any): string => {
    const calls = res.json.mock.calls;
    if (calls.length > 0) {
        return calls[0][0].message || '';
    }
    return '';
};

// Helper to check if response is successful
export const isSuccessResponse = (res: any): boolean => {
    const calls = res.json.mock.calls;
    if (calls.length > 0) {
        return calls[0][0].success === true;
    }
    return false;
};
