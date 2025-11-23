import '@testing-library/jest-dom';
import React from 'react';

// Mock next/router
jest.mock('next/router', () => require('next-router-mock'));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
    usePathname: () => '/',
}));

// Mock @dnd-kit modules
jest.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: any) => React.createElement('div', null, children),
    useSensor: jest.fn(),
    useSensors: jest.fn(() => []),
    PointerSensor: jest.fn(),
    closestCenter: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: any) => React.createElement('div', null, children),
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: () => { },
        transform: null,
        transition: null,
        isDragging: false,
    }),
    verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@dnd-kit/utilities', () => ({
    CSS: {
        Transform: {
            toString: jest.fn(() => ''),
        },
    },
}));
