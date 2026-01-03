
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectsList } from '../../components/ProjectsList';
import { apiClient } from '../../lib/api';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';

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

// Partially mock useQuery and useMutation to control internals if needed, 
// but we'll try to rely on real react-query behavior wrapped in a provider if possible, 
// or just mock the hooks if that's simpler for this check.
// For testing optimistic updates specifically without a full integrated query client, mocking the hooks is often easier
// to verify that `onMutate` returns what we expect or that the UI reacts to `isPending`.

// Because testing "optimistic updates" (the onMutate logic) is hard with just component rendering 
// (unless we inspect the cache), we will focus on:
// 1. Loading states (buttons disabled).
// 2. Ensuring delete logic calls the mutation.

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
            // If this is the create project mutation
            if (options && options.mutationFn && options.mutationFn.toString().includes('createProject')) {
                return { mutate: mockMutate, isPending: true };
            }
            return { mutate: jest.fn(), isPending: false };
        });

        render(<ProjectsList />);

        // Click "Create new project" tile to open modal
        fireEvent.click(screen.getByText('Create new project'));

        // Modal should be open. The buttons should be disabled because isPending is true.
        const createBtn = screen.getByRole('button', { name: /Creating.../i });
        expect(createBtn).toBeDisabled();
        expect(createBtn).toHaveTextContent('Creating...');

        // Cancel button should also be disabled
        const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
        expect(cancelBtn).toBeDisabled();
    });

    it('Delete Project confirmation should show loading state and be disabled', async () => {
        const mockMutate = jest.fn();
        // Setup delete mutation to be pending
        (useMutation as jest.Mock).mockImplementation((options) => {
            // Assuming the delete mutation is identified by calling deleteProject
            // We can't easily distinguish just by checking function string if they are similar,
            // but let's try to match based on the use order or content.
            // Actually, verifying the 'danger' button state in confirmation modal is what we want.

            // Let's assume the second useMutation call in the component is createTeam, third is deleteProject.
            // This is fragile. Stronger way:

            // We can check if `onMutate` is present in options to identify delete mutation.
            if (options && options.onMutate) {
                return { mutate: mockMutate, isPending: true };
            }
            return { mutate: jest.fn(), isPending: false };
        });

        render(<ProjectsList />);

        // Find the delete button for the project (it's hidden by default, so we might need to hover or just fire click)
        // The Trash icon button
        const deleteBtn = screen.getByTitle('Delete project');
        fireEvent.click(deleteBtn);

        // Confirmation modal appears
        // The confirm button should say 'Processing...' and be disabled
        const confirmBtn = screen.getByRole('button', { name: /Processing.../i });
        expect(confirmBtn).toBeDisabled();
        expect(confirmBtn).toHaveTextContent('Processing...');
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
        expect(capturedOptions.onMutate).toBeInstanceOf(Function);

        // Test the onMutate function logic directly
        const context = await capturedOptions.onMutate('p1');

        // It should cancel queries
        expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['projects'] });

        // It should optimistically update data
        expect(mockSetQueryData).toHaveBeenCalledWith(['projects'], expect.any(Function));

        // Verify the updater function behavior
        const updater = mockSetQueryData.mock.calls[0][1];
        const oldData = [{ _id: 'p1' }, { _id: 'p2' }];
        const newData = updater(oldData);
        expect(newData).toHaveLength(1);
        expect(newData[0]._id).toBe('p2');
    });
});
