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
            expect(project.shortId).toBeDefined();
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

        it('should auto-generate unique shortId', async () => {
            const project1 = new Project({
                name: 'Project 1',
            });
            await project1.save();

            const project2 = new Project({
                name: 'Project 2',
            });
            await project2.save();

            expect(project1.shortId).toBeDefined();
            expect(project2.shortId).toBeDefined();
            expect(project1.shortId).not.toBe(project2.shortId);
        });

        it('should allow custom shortId', async () => {
            const customShortId = 'CUSTOM123';
            const project = new Project({
                name: 'Test Project',
                shortId: customShortId,
            });
            await project.save();

            expect(project.shortId).toBe(customShortId);
        });

        it('should enforce unique shortId', async () => {
            const project1 = new Project({
                name: 'Project 1',
            });
            await project1.save();

            const project2 = new Project({
                name: 'Project 2',
                shortId: project1.shortId,
            });

            await expect(project2.save()).rejects.toThrow();
        });
    });
});
