import mongoose from 'mongoose';
import { User, Project, Task, TaskGroup, ProjectMember, TaskAssigned } from '../../models';
import bcrypt from 'bcryptjs';

/**
 * Test helper utilities for creating mock data and common test operations
 * Note: Using mocked models - no real database connection needed
 */

// Mock mongoose connection
jest.mock('mongoose', () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    connection: {
        collections: {},
    },
}));

// User factory
export const createTestUser = async (overrides: Partial<any> = {}) => {
    const defaultUser = {
        _id: `user_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        password: await bcrypt.hash('password123', 10),
        fullName: 'Test User',
        initials: 'TU',
        bio: 'Test bio',
        role: 'user',
        active: true,
        profileIcon: {
            initials: 'TU',
            bgColor: '#3b82f6',
        },
        save: jest.fn().mockResolvedValue(this),
    };

    return { ...defaultUser, ...overrides };
};

// Project factory
export const createTestProject = async (userId: string, overrides: Partial<any> = {}) => {
    const defaultProject = {
        _id: `project_${Date.now()}`,
        name: `Test Project ${Date.now()}`,
        shortId: `TP${Date.now()}`,
        save: jest.fn().mockResolvedValue(this),
    };

    const project = { ...defaultProject, ...overrides };

    const projectMember = {
        _id: `member_${Date.now()}`,
        projectId: project._id,
        userId,
        role: 'owner',
        save: jest.fn().mockResolvedValue(this),
    };

    return project;
};

// Task Group factory
export const createTestTaskGroup = async (projectId: string, overrides: Partial<any> = {}) => {
    const defaultTaskGroup = {
        _id: `taskgroup_${Date.now()}`,
        projectId,
        name: `Test Task Group ${Date.now()}`,
        position: 0,
        save: jest.fn().mockResolvedValue(this),
    };

    return { ...defaultTaskGroup, ...overrides };
};

// Task factory
export const createTestTask = async (taskGroupId: string, overrides: Partial<any> = {}) => {
    const defaultTask = {
        _id: `task_${Date.now()}`,
        taskGroupId,
        name: `Test Task ${Date.now()}`,
        shortId: `${Date.now()}`,
        description: 'Test task description',
        position: 0,
        complete: false,
        hasTime: false,
        assigned: [],
        labels: [],
        save: jest.fn().mockResolvedValue(this),
    };

    return { ...defaultTask, ...overrides };
};

// Assign user to task
export const assignUserToTask = async (taskId: string, userId: string) => {
    const taskAssigned = {
        _id: `assigned_${Date.now()}`,
        taskId,
        userId,
        assignedDate: new Date(),
        save: jest.fn().mockResolvedValue(this),
    };

    return taskAssigned;
};

// Mock Express Request
export const mockRequest = (overrides: Partial<any> = {}) => {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
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
