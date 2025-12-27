import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from '../../components/TaskList';
import { Task } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => ({
    useDroppable: () => ({
        setNodeRef: jest.fn(),
        isOver: false,
    }),
}));

jest.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: { children: React.ReactNode }) => {
        return <div data-testid="sortable-context">{children}</div>;
    },
    verticalListSortingStrategy: {},
}));

// Mock TaskCard
jest.mock('../../components/TaskCard', () => ({
    TaskCard: ({ task }: { task: Task }) => {
        return <div data-testid={`task-card-${task._id}`}>{task.name}</div>;
    },
}));

// Mock CardComposer
jest.mock('../../components/CardComposer', () => ({
    CardComposer: ({ onSave, onCancel }: { onSave: (name: string) => void, onCancel: () => void }) => {
        return (
            <div data-testid="card-composer">
                <button key="save" onClick={() => onSave('New Task')}>Save</button>
                <button key="cancel" onClick={onCancel}>Cancel</button>
            </div>
        );
    },
}));

// Mock Plus icon
jest.mock('@/components/icons', () => ({
    Plus: () => {
        return <div data-testid="plus-icon" />;
    },
}));

const mockTasks: Task[] = [
    { _id: 'task1', name: 'Task 1', complete: false } as Task,
    { _id: 'task2', name: 'Task 2', complete: true } as Task,
];

const mockList = {
    _id: 'list1',
    name: 'To Do',
    position: 0,
    tasks: mockTasks,
};

describe('TaskList', () => {
    const mockOnUpdateTask = jest.fn();
    const mockOnDeleteTask = jest.fn();
    const mockOnCreateTask = jest.fn();
    const mockOnTaskClick = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders list details correctly', () => {
        render(
            <TaskList
                list={mockList}
                onUpdateTask={mockOnUpdateTask}
                onDeleteTask={mockOnDeleteTask}
                onCreateTask={mockOnCreateTask}
                onTaskClick={mockOnTaskClick}
            />
        );

        expect(screen.getByText('To Do')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Task count
        expect(screen.getByTestId('task-card-task1')).toBeInTheDocument();
        expect(screen.getByTestId('task-card-task2')).toBeInTheDocument();
    });

    it('opens card composer when Add Card is clicked', () => {
        render(
            <TaskList
                list={mockList}
                onUpdateTask={mockOnUpdateTask}
                onDeleteTask={mockOnDeleteTask}
                onCreateTask={mockOnCreateTask}
                onTaskClick={mockOnTaskClick}
            />
        );

        fireEvent.click(screen.getByText('Add a card'));
        expect(screen.getByTestId('card-composer')).toBeInTheDocument();
    });

    it('calls onCreateTask when new task is saved', () => {
        render(
            <TaskList
                list={mockList}
                onUpdateTask={mockOnUpdateTask}
                onDeleteTask={mockOnDeleteTask}
                onCreateTask={mockOnCreateTask}
                onTaskClick={mockOnTaskClick}
            />
        );

        fireEvent.click(screen.getByText('Add a card'));
        fireEvent.click(screen.getByText('Save'));

        expect(mockOnCreateTask).toHaveBeenCalledWith('list1', 'New Task');
    });

    it('closes card composer when Cancel is clicked', () => {
        render(
            <TaskList
                list={mockList}
                onUpdateTask={mockOnUpdateTask}
                onDeleteTask={mockOnDeleteTask}
                onCreateTask={mockOnCreateTask}
                onTaskClick={mockOnTaskClick}
            />
        );

        fireEvent.click(screen.getByText('Add a card'));
        fireEvent.click(screen.getByText('Cancel'));

        expect(screen.queryByTestId('card-composer')).not.toBeInTheDocument();
        expect(screen.getByText('Add a card')).toBeInTheDocument();
    });
});
