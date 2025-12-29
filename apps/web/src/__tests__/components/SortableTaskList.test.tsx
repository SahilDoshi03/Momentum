import React from 'react';
import { render, screen } from '@testing-library/react';
import { SortableTaskList } from '@/components/SortableTaskList';

// Mock dnd-kit
jest.mock('@dnd-kit/sortable', () => ({
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

// Mock TaskList
jest.mock('@/components/TaskList', () => ({
    TaskList: ({ list }: any) => <div data-testid="task-list">{list.name}</div>
}));

describe('SortableTaskList', () => {
    const mockList = {
        _id: '1',
        name: 'Todo',
        position: 0,
        tasks: []
    };
    const mockProps = {
        list: mockList,
        onUpdateTask: jest.fn(),
        onDeleteTask: jest.fn(),
        onCreateTask: jest.fn(),
        onTaskClick: jest.fn(),
        isDragOverlay: false,
    };

    it('renders task list', () => {
        render(<SortableTaskList {...mockProps} />);
        expect(screen.getByTestId('task-list')).toHaveTextContent('Todo');
    });
});
