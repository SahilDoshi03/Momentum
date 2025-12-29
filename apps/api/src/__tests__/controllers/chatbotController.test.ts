import request from 'supertest';
import express, { Application } from 'express';
import { sendMessage } from '../../controllers/chatbotController';
import { createTestUser, mockRequest, mockResponse, mockNext } from '../utils/testHelpers';

import { processChatMessage } from '../../services/chatbotService';

// Mock the service
jest.mock('../../services/chatbotService', () => ({
    processChatMessage: jest.fn().mockResolvedValue({
        response: 'AI response',
        toolResults: []
    }),
}));

describe('Chatbot Controller', () => {
    let testUser: any;

    beforeEach(async () => {
        testUser = await createTestUser();
        (processChatMessage as jest.Mock).mockResolvedValue({
            response: 'AI response',
            toolResults: []
        });
    });

    describe('sendMessage', () => {
        it('should send message successfully', async () => {
            const req = mockRequest({
                user: testUser,
                body: {
                    message: 'Hello',
                    conversationHistory: []
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await sendMessage(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        response: 'AI response',
                    }),
                })
            );
        });

        it('should require message', async () => {
            const req = mockRequest({
                user: testUser,
                body: {
                    // message missing
                },
            });
            const res = mockResponse();
            const next = mockNext();

            await sendMessage(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Message is required',
                })
            );
        });
    });
});
