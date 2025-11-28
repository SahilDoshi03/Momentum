import { PersonalProject } from '../../models/PersonalProject';
import { createTestUser, createTestProject } from '../utils/testHelpers';

describe('PersonalProject Model', () => {
    let testUserId: string;
    let testProjectId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        testUserId = testUser._id.toString();
        const testProject = await createTestProject(testUserId);
        testProjectId = testProject._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a personal project with valid data', async () => {
            const personalProjectData = {
                userId: testUserId,
                projectId: testProjectId,
            };

            const personalProject = new PersonalProject(personalProjectData);
            await personalProject.save();

            expect(personalProject._id).toBeDefined();
            expect(personalProject.userId).toBe(testUserId);
            expect(personalProject.projectId).toBe(testProjectId);
        });

        it('should require userId', async () => {
            const personalProject = new PersonalProject({
                projectId: testProjectId,
            });

            await expect(personalProject.save()).rejects.toThrow();
        });

        it('should require projectId', async () => {
            const personalProject = new PersonalProject({
                userId: testUserId,
            });

            await expect(personalProject.save()).rejects.toThrow();
        });

        it('should enforce unique userId and projectId combination', async () => {
            const personalProjectData = {
                userId: testUserId,
                projectId: testProjectId,
            };

            await new PersonalProject(personalProjectData).save();

            const duplicatePersonalProject = new PersonalProject(personalProjectData);

            await expect(duplicatePersonalProject.save()).rejects.toThrow();
        });
    });
});
