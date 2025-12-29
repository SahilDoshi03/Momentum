import { Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { processChatMessage } from '../services/chatbotService';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatRequest {
    message: string;
    conversationHistory?: ChatMessage[];
}

/**
 * Send a message to the chatbot
 */
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { message, conversationHistory = [] }: ChatRequest = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Message is required',
        });
    }

    const context = {
        userId: user._id.toString(),
        userEmail: user.email || user.username,
    };

    try {
        const result = await processChatMessage(message, context, conversationHistory);

        res.json({
            success: true,
            data: {
                response: result.response,
                toolResults: result.toolResults,
            },
        });
    } catch (error: any) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'An error occurred while processing your message',
        });
    }
});
