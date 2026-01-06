import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CardComposer } from '@/components/CardComposer';

describe('CardComposer', () => {
    const mockSave = jest.fn();
    const mockCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders textarea focused', () => {
        render(<CardComposer onSave={mockSave} onCancel={mockCancel} />);
        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        expect(textarea).toHaveFocus();
    });

    it('submits on enter key', async () => {
        const user = userEvent.setup();
        render(<CardComposer onSave={mockSave} onCancel={mockCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        await user.type(textarea, 'New Task{Enter}');

        expect(mockSave).toHaveBeenCalledWith('New Task');
    });

    it('cancels on escape key', async () => {
        const user = userEvent.setup();
        render(<CardComposer onSave={mockSave} onCancel={mockCancel} />);

        const textarea = screen.getByPlaceholderText('Enter a title for this card...');
        await user.type(textarea, '{Escape}');

        expect(mockCancel).toHaveBeenCalled();
    });

    it('stops propagation of keydown events', () => {
        const handleParentKeyDown = jest.fn();

        render(
            <div onKeyDown={handleParentKeyDown}>
                <CardComposer onSave={mockSave} onCancel={mockCancel} />
            </div>
        );

        const input = screen.getByPlaceholderText('Enter a title for this card...');

        // Fire space key
        fireEvent.keyDown(input, { key: ' ', code: 'Space' });

        // Parent should NOT receive the event because of stopPropagation
        expect(handleParentKeyDown).not.toHaveBeenCalled();

        // Fire another key just to show it's consistent
        fireEvent.keyDown(input, { key: 'a' });
        expect(handleParentKeyDown).not.toHaveBeenCalled();
    });
});
