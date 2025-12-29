import { processChatMessage } from '../../services/chatbotService';
import { createTestUser, createTestProject, createTestTaskGroup, createTestTask, clearDatabase } from '../utils/testHelpers';
import { Project, Task, TaskGroup, ProjectMember } from '../../models';
import { AppError } from '../../middleware';

// Mock the AI SDK
jest.mock('ai', () => ({
    generateText: jest.fn().mockResolvedValue({
        text: 'Mocked AI response',
        toolResults: []
    }),
    tool: (args: any) => args,
}));

// Mock Google Generative AI
jest.mock('@ai-sdk/google', () => {
    const mockGoogleProvider = jest.fn().mockReturnValue('mock-model');
    return {
        createGoogleGenerativeAI: jest.fn().mockReturnValue(mockGoogleProvider),
    };
});

// Mock config
jest.mock('../../config', () => ({
    config: {
        geminiApiKey: 'mock-api-key',
    },
}));

describe('Chatbot Service', () => {
    let testUser: any;
    let testProject: any;
    let testTaskGroup: any;
    let context: any;

    beforeEach(async () => {
        const mockGoogleProvider = jest.fn().mockReturnValue('mock-model');
        (require('@ai-sdk/google').createGoogleGenerativeAI as jest.Mock).mockReturnValue(mockGoogleProvider);

        (require('ai').generateText as jest.Mock).mockResolvedValue({
            text: 'Mocked AI response',
            toolResults: []
        });

        await clearDatabase();
        testUser = await createTestUser();
        testProject = await createTestProject(testUser._id, { name: 'Test Project' });
        testTaskGroup = await createTestTaskGroup(testProject._id, { name: 'Test Group' });

        context = {
            userId: testUser._id.toString(),
            userEmail: testUser.email,
        };
    });

    describe('processChatMessage', () => {
        it('should process a basic message and return response', async () => {
            const result = await processChatMessage('Hello', context);

            expect(result).toHaveProperty('response');
            expect(result.response).toBe('Mocked AI response');
        });

        // We can't easily test the internal tools execution without exporting `createChatbotTools` 
        // or mocking `generateText` implementation to call tools.
        // For now, we verify the service structure and basic flow.
    });
});
