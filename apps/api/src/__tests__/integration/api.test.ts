import request from 'supertest';
import app from '../../server'; // Assuming app is exported from server.ts
import { createTestUser, clearDatabase } from '../utils/testHelpers';
import mongoose from 'mongoose';

describe('API Integration Tests', () => {
    let testUser: any;
    let authToken: string;

    beforeAll(async () => {
        // Find a way to close server might be needed if it auto-starts
    });

    beforeEach(async () => {
        await clearDatabase();
        // Create user and get token
        const userData = {
            email: 'integration@example.com',
            password: 'password123',
            username: 'integration',
            firstName: 'Integration',
            lastName: 'User'
        };

        // Register via API to get real token flow or use helper
        // Using helper for user creation, but we need a valid JWT.
        // If we don't have a token helper, we can hit the login endpoint.

        const registerRes = await request(app)
            .post('/api/auth/register')
            .send(userData);
        expect(registerRes.status).toBe(201);

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        expect(loginRes.status).toBe(200); // Assert login success

        authToken = loginRes.body.data.token;
        testUser = loginRes.body.data.user;
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('Project Flow', () => {
        it('should create a project, task group, and task', async () => {
            // 1. Create Project
            const projectRes = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Integration Project' });

            expect(projectRes.status).toBe(201);
            const projectId = projectRes.body.data._id;

            // 2. Create Task Group
            const groupRes = await request(app)
                .post('/api/tasks/groups')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    projectId,
                    name: 'Integration Group'
                });

            expect(groupRes.status).toBe(201);
            const taskGroupId = groupRes.body.data._id;

            // 3. Create Task
            const taskRes = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    taskGroupId,
                    name: 'Integration Task'
                });

            expect(taskRes.status).toBe(201);
            expect(taskRes.body.data.name).toBe('Integration Task');
        });
    });

    describe('Error Handling', () => {
        it('should return 401 for unauthorized access', async () => {
            const res = await request(app)
                .get('/api/projects');

            expect(res.status).toBe(401);
        });

        it('should return 404 for non-existent route', async () => {
            const res = await request(app)
                .get('/api/does-not-exist')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });
    });
});
