
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectsList } from '../../components/ProjectsList';
import { apiClient } from '../../lib/api';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('../../lib/api', () => ({
    apiClient: {
        getProjects: jest.fn(),
        getTeams: jest.fn(),
        createProject: jest.fn(),
        createTeam: jest.fn(),
        deleteProject: jest.fn()
    }
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}));

jest.mock('@tanstack/react-query', () => {
    const original = jest.requireActual('@tanstack/react-query');
    return {
        ...original,
        useQuery: jest.fn(),
        useMutation: jest.fn(),
        useQueryClient: jest.fn()
    };
});

describe('ProjectsList Optimistic & Loading States', () => {
    const mockNiceProjects = [
        { _id: 'p1', name: 'Project 1', teamId: null, currentUserRole: 'owner' }
    ];

    const mockInvalidateQueries = jest.fn();
    const mockSetQueryData = jest.fn();
    const mockCancelQueries = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useQueryClient as jest.Mock).mockReturnValue({
            invalidateQueries: mockInvalidateQueries,
            setQueryData: mockSetQueryData,
            cancelQueries: mockCancelQueries,
            getQueryData: jest.fn().mockReturnValue(mockNiceProjects)
        });

        (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'projects') return { data: mockNiceProjects, isLoading: false };
            if (queryKey[0] === 'teams') return { data: [], isLoading: false };
            return { data: [], isLoading: false };
        });
    });

    it('Create Project button should be disabled while pending', async () => {
        const mockMutate = jest.fn();
        (useMutation as jest.Mock).mockImplementation((options) => {
            if (options && options.mutationFn && options.mutationFn.toString().includes('createProject')) {
                return { mutate: mockMutate, isPending: true };
            }
            return { mutate: jest.fn(), isPending: false };
        });

        render(<ProjectsList />);

        fireEvent.click(screen.getByText('Create new project'));

        const createBtn = screen.getByRole('button', { name: /Creating.../i }) as HTMLButtonElement;
        expect(createBtn.disabled).toBe(true);
        expect(createBtn.textContent).toBe('Creating...');

        const cancelBtn = screen.getByRole('button', { name: /Cancel/i }) as HTMLButtonElement;
        expect(cancelBtn.disabled).toBe(true);
    });

    it('Delete Project confirmation should show loading state and be disabled', async () => {
        const mockMutate = jest.fn();
        (useMutation as jest.Mock).mockImplementation((options) => {
            if (options && options.onMutate) {
                return { mutate: mockMutate, isPending: true };
            }
            return { mutate: jest.fn(), isPending: false };
        });

        render(<ProjectsList />);

        const deleteBtn = screen.getByTitle('Delete project');
        fireEvent.click(deleteBtn);

        const confirmBtn = screen.getByRole('button', { name: /Processing.../i }) as HTMLButtonElement;
        expect(confirmBtn.disabled).toBe(true);
        expect(confirmBtn.textContent).toBe('Processing...');
    });

    it('Optimistic Update Logic (onMutate) is configured correctly', async () => {
        let capturedOptions: any;
        (useMutation as jest.Mock).mockImplementation((options) => {
            if (options && options.onMutate) {
                capturedOptions = options;
            }
            return { mutate: jest.fn(), isPending: false };
        });

        render(<ProjectsList />);

        expect(capturedOptions).toBeDefined();
        // Check if onMutate is a function using typeof check or simple truthiness since toBeInstanceOf might fallback to basic check if not mocked perfectly
        expect(typeof capturedOptions.onMutate).toBe('function');

        const context = await capturedOptions.onMutate('p1');

        expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['projects'] });
        expect(mockSetQueryData).toHaveBeenCalledWith(['projects'], expect.any(Function));

        const updater = mockSetQueryData.mock.calls[0][1];
        const oldData = [{ _id: 'p1' }, { _id: 'p2' }];
        const newData = updater(oldData);
        expect(newData.length).toBe(1);
        expect(newData[0]._id).toBe('p2');
    });
});
