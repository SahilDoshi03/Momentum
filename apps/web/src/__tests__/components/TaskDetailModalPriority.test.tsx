import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { Task, Project, apiClient } from '@/lib/api';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock apiClient
jest.mock('@/lib/api', () => ({
    ...jest.requireActual('@/lib/api'),
    apiClient: {
        updateTask: jest.fn().mockResolvedValue({ success: true, data: {} }),
        getLabelColors: jest.fn().mockResolvedValue({ success: true, data: [] }),
    }
}));

// Mock UI components
jest.mock('@/components/ui/Modal', () => ({
    Modal: ({ children, isOpen, footer }: any) => isOpen ? (
        <div data-testid="modal">
            {children}
            <div data-testid="modal-footer">{footer}</div>
        </div>
    ) : null
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithClient = (ui: React.ReactElement) => {
    return render(
        <QueryClientProvider client={queryClient}>
            {ui}
        </QueryClientProvider>
    );
};

jest.mock('@/components/ui/Dropdown', () => ({
    Dropdown: ({ trigger, children }: any) => (
        <div data-testid="dropdown">
            <div data-testid="dropdown-trigger">{trigger}</div>
            <div data-testid="dropdown-content">{children}</div>
        </div>
    ),
    DropdownItem: ({ children, onClick }: any) => (
        <div data-testid="dropdown-item" onClick={onClick}>{children}</div>
    )
}));

jest.mock('@/components/ui/ProfileIcon', () => ({
    ProfileIcon: () => <div />
}));

describe('TaskDetailModal Priority Dropdown', () => {
    const mockTask: Task = {
        _id: '1',
        taskGroupId: 'group1',
        name: 'Test Task',
        priority: 'medium',
        position: 0,
        complete: false,
        hasTime: false,
        createdAt: new Date().toISOString(),
        assigned: [],
        labels: []
    };

    const mockProject: Project = {
        _id: 'p1',
        name: 'Test Project',
        createdAt: new Date().toISOString()
    };

    const mockProps = {
        isOpen: true,
        onClose: jest.fn(),
        task: mockTask,
        project: mockProject,
        onUpdateTask: jest.fn(),
        onDeleteTask: jest.fn(),
    };

    it('renders priority dropdown trigger', () => {
        renderWithClient(<TaskDetailModal {...mockProps} />);
        const trigger = screen.getByTestId('dropdown-trigger');
        expect(within(trigger).getByText('Normal Priority')).toBeInTheDocument();
    });

    it('allows selecting Low priority', async () => {
        const user = userEvent.setup();
        renderWithClient(<TaskDetailModal {...mockProps} />);

        const lowOption = screen.getByText('Low Priority');
        await user.click(lowOption);

        const saveButton = screen.getByText('Save Changes');
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockProps.onUpdateTask).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ priority: 'low' })
            );
        });
    });

    it('allows selecting High priority', async () => {
        const user = userEvent.setup();
        renderWithClient(<TaskDetailModal {...mockProps} />);

        const highOption = screen.getByText('High Priority');
        await user.click(highOption);

        const saveButton = screen.getByText('Save Changes');
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockProps.onUpdateTask).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ priority: 'high' })
            );
        });
    });
});
