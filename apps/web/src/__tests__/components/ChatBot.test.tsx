import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatBot from '@/components/ChatBot';
import { apiClient } from '@/lib/api';

// Mock API client
jest.mock('@/lib/api', () => ({
    apiClient: {
        sendChatMessage: jest.fn(),
    },
}));

jest.mock('@tanstack/react-query', () => ({
    useMutation: jest.fn(),
    useQueryClient: jest.fn(() => ({
        invalidateQueries: jest.fn(),
    })),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('ChatBot', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const { useMutation } = require('@tanstack/react-query');
        (useMutation as jest.Mock).mockImplementation((options) => {
            const { mutationFn, onSuccess, onError } = options || {};
            return {
                mutate: (variables: any) => {
                    if (mutationFn) {
                        mutationFn(variables)
                            .then((data: any) => onSuccess && onSuccess(data))
                            .catch((error: any) => onError && onError(error));
                    }
                },
                isPending: false
            };
        });
    });

    it('renders launch button initially', () => {
        render(<ChatBot />);
        expect(screen.getByLabelText('Open chat')).toBeInTheDocument();
    });

    it('opens chat window when clicked', async () => {
        const user = userEvent.setup();
        render(<ChatBot />);

        await user.click(screen.getByLabelText('Open chat'));

        expect(screen.getByText('Momentum Assistant')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
    });

    it('closes chat window when close button clicked', async () => {
        const user = userEvent.setup();
        render(<ChatBot />);

        await user.click(screen.getByLabelText('Open chat'));
        await user.click(screen.getByLabelText('Close chat'));

        expect(screen.queryByText('Momentum Assistant')).not.toBeInTheDocument();
    });

    it('sends message and displays response', async () => {
        const user = userEvent.setup();
        (apiClient.sendChatMessage as jest.Mock).mockResolvedValue({
            success: true,
            data: {
                response: 'Hello! How can I help you?',
                toolResults: []
            }
        });

        render(<ChatBot />);
        await user.click(screen.getByLabelText('Open chat'));

        const input = screen.getByPlaceholderText('Ask me anything...');
        await user.type(input, 'Hi{Enter}');

        expect(input).toHaveValue('');
        // Check if user message is displayed immediately
        expect(screen.getByText('Hi')).toBeInTheDocument();

        await waitFor(() => {
            expect(apiClient.sendChatMessage).toHaveBeenCalledWith('Hi', []);
            expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
        });
    });

    it('handles error state', async () => {
        const user = userEvent.setup();
        (apiClient.sendChatMessage as jest.Mock).mockRejectedValue(new Error('API Error'));

        render(<ChatBot />);
        await user.click(screen.getByLabelText('Open chat'));

        const input = screen.getByPlaceholderText('Ask me anything...');
        await user.type(input, 'Hi{Enter}');

        await waitFor(() => {
            expect(screen.getByText('Sorry, I encountered an error: API Error')).toBeInTheDocument();
        });
    });

    it('clears chat history', async () => {
        const user = userEvent.setup();
        render(<ChatBot />);
        await user.click(screen.getByLabelText('Open chat'));

        // Manually add a message to state via interaction would be hard without exposing state, 
        // but we can test the button presence if messages exist. 
        // Ideally we'd mock the hook state but for integration test:

        const input = screen.getByPlaceholderText('Ask me anything...');
        await user.type(input, 'Test{Enter}');

        await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());

        const clearButton = screen.getByTitle('Clear chat');
        await user.click(clearButton);

        expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
});
