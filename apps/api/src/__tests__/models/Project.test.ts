import { Project } from '../../models/Project';
import { createTestUser } from '../utils/testHelpers';

describe('Project Model', () => {
    let testUserId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        testUserId = testUser._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a project with valid data', async () => {
            const projectData = {
                name: 'Test Project',
            };

            const project = new Project(projectData);
            await project.save();

            expect(project._id).toBeDefined();
            expect(project.name).toBe('Test Project');

            expect(project.createdAt).toBeDefined();
            expect(project.createdAt).toBeDefined();
        });

        it('should require name', async () => {
            const project = new Project({});

            await expect(project.save()).rejects.toThrow();
        });

        it('should enforce maximum name length', async () => {
            const longName = 'a'.repeat(101); // Max is 100

            const project = new Project({
                name: longName,
            });

            await expect(project.save()).rejects.toThrow();
        });
    });
});
