import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskList } from '@/components/TaskList';

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => ({
    useDroppable: () => ({
        setNodeRef: jest.fn(),
        isOver: false,
    }),
}));

jest.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: any) => <div>{children}</div>,
    verticalListSortingStrategy: {},
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

jest.mock('@dnd-kit/utilities', () => ({
    CSS: { Transform: { toString: jest.fn() } }
}));

// Mock TaskCard
jest.mock('@/components/TaskCard', () => ({
    TaskCard: ({ task }: any) => <div data-testid={`task-${task.name}`}>{task.name}</div>
}));

// Mock CardComposer
jest.mock('@/components/CardComposer', () => ({
    CardComposer: ({ onSave, onCancel }: any) => (
        <div>
            <input data-testid="composer-input" />
            <button onClick={() => onSave('New Task')}>Add</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    )
}));

describe('TaskList', () => {
    const mockList = {
        _id: '1',
        name: 'Todo',
        position: 0,
        tasks: [{ _id: 't1', name: 'Task 1' }]
    };

    const mockProps = {
        list: mockList as any,
        onUpdateTask: jest.fn(),
        onDeleteTask: jest.fn(),
        onCreateTask: jest.fn(),
        onTaskClick: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders list name and tasks', () => {
        render(<TaskList {...mockProps} />);
        expect(screen.getByText('Todo')).toBeInTheDocument();
        expect(screen.getByTestId('task-Task 1')).toBeInTheDocument();
    });

    it('opens composer and adds task', async () => {
        const user = userEvent.setup();
        render(<TaskList {...mockProps} />);

        await user.click(screen.getByText('Add a card'));

        expect(screen.getByTestId('composer-input')).toBeInTheDocument();

        await user.click(screen.getByText('Add'));

        expect(mockProps.onCreateTask).toHaveBeenCalledWith('1', 'New Task');
    });
});
