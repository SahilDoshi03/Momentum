import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '@/components/TaskCard';
import { Task } from '@/lib/api';

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

jest.mock('@/components/ui/ProfileIcon', () => ({
    ProfileIcon: () => <div data-testid="profile-icon" />
}));

describe('TaskCard Priority', () => {
    const mockTask: Task = {
        _id: '1',
        taskGroupId: 'group1',
        name: 'Test Task',
        description: '',
        position: 0,
        complete: false,
        priority: 'medium',
        hasTime: false,
        createdAt: new Date().toISOString(),
        assigned: [],
        labels: []
    };

    const mockProps = {
        task: mockTask,
        onUpdate: jest.fn(),
        onDelete: jest.fn(),
        onClick: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders priority toggle button', () => {
        render(<TaskCard {...mockProps} />);
        expect(screen.getByTitle('Set to high priority')).toBeInTheDocument();
    });

    it('toggles priority on click (Medium -> High -> Low -> Medium)', async () => {
        const user = userEvent.setup();

        // 1. Medium -> High
        const { rerender } = render(<TaskCard {...mockProps} />);
        const toHighButton = screen.getByTitle('Set to high priority');
        await user.click(toHighButton);
        expect(mockProps.onUpdate).toHaveBeenCalledWith('1', { priority: 'high' });

        // 2. High -> Low
        // Manually update prop to simulate state change
        const highTask = { ...mockTask, priority: 'high' as const };
        rerender(<TaskCard {...mockProps} task={highTask} />);
        const toLowButton = screen.getByTitle('Set to low priority');
        await user.click(toLowButton);
        expect(mockProps.onUpdate).toHaveBeenCalledWith('1', { priority: 'low' });

        // 3. Low -> Medium
        const lowTask = { ...mockTask, priority: 'low' as const };
        rerender(<TaskCard {...mockProps} task={lowTask} />);
        const toMediumButton = screen.getByTitle('Set to normal priority');
        await user.click(toMediumButton);
        expect(mockProps.onUpdate).toHaveBeenCalledWith('1', { priority: 'medium' });
    });

    it('renders high priority state correctly', () => {
        const highPriorityTask = { ...mockTask, priority: 'high' as const };
        const { container } = render(<TaskCard {...mockProps} task={highPriorityTask} />);

        const card = container.firstChild?.firstChild;
        expect(card).toHaveClass('border-l-4', 'border-l-[var(--danger)]');
    });

    it('renders medium priority state correctly (Blue)', () => {
        const mediumPriorityTask = { ...mockTask, priority: 'medium' as const };
        const { container } = render(<TaskCard {...mockProps} task={mediumPriorityTask} />);

        const card = container.firstChild?.firstChild;
        expect(card).toHaveClass('border-l-4', 'border-l-[var(--info)]');
    });

    it('renders low priority state correctly (No color)', () => {
        const lowPriorityTask = { ...mockTask, priority: 'low' as const };
        const { container } = render(<TaskCard {...mockProps} task={lowPriorityTask} />);

        const card = container.firstChild?.firstChild;
        expect(card).not.toHaveClass('border-l-4', 'border-l-[var(--info)]');
        expect(card).not.toHaveClass('border-l-4', 'border-l-[var(--danger)]');
    });
});
