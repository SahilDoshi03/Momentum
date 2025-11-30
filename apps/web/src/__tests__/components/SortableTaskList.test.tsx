import React from 'react';
import { render, screen } from '@testing-library/react';
import { SortableTaskList } from '../../components/SortableTaskList';
import '@testing-library/jest-dom';

// Mock dnd-kit
jest.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: { 'data-attr': 'sortable-attrs' },
        listeners: { 'data-listener': 'sortable-listeners' },
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

jest.mock('@dnd-kit/utilities', () => ({
    CSS: {
        Transform: {
            toString: jest.fn(),
        },
    },
}));

// Mock TaskList
jest.mock('../../components/TaskList', () => ({
    TaskList: ({ list }: any) => <div data-testid="task-list">{list.name}</div>,
}));

const mockList = {
    _id: 'l1',
    name: 'Test List',
    position: 0,
    tasks: [],
};

describe('SortableTaskList', () => {
    const mockProps = {
        list: mockList,
        onUpdateTask: jest.fn(),
        onDeleteTask: jest.fn(),
        onCreateTask: jest.fn(),
        onTaskClick: jest.fn(),
        isDragOverlay: false,
    };

    it('renders task list with sortable attributes', () => {
        render(<SortableTaskList {...mockProps} />);

        expect(screen.getByTestId('task-list')).toBeInTheDocument();
        expect(screen.getByText('Test List')).toBeInTheDocument();

        // Check if attributes are applied to the wrapper
        const wrapper = screen.getByTestId('task-list').parentElement;
        expect(wrapper).toHaveAttribute('data-attr', 'sortable-attrs');
        expect(wrapper).toHaveAttribute('data-listener', 'sortable-listeners');
    });
});
