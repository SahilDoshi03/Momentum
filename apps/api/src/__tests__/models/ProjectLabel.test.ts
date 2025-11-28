import { ProjectLabel } from '../../models/ProjectLabel';
import { LabelColor } from '../../models/LabelColor';
import { createTestUser, createTestProject } from '../utils/testHelpers';

describe('ProjectLabel Model', () => {
    let testProjectId: string;
    let testLabelColorId: string;

    beforeEach(async () => {
        const testUser = await createTestUser();
        const testProject = await createTestProject(testUser._id.toString());
        testProjectId = testProject._id.toString();

        const labelColor = new LabelColor({
            name: 'Red',
            colorHex: '#FF0000',
            position: 1,
        });
        await labelColor.save();
        testLabelColorId = labelColor._id.toString();
    });

    describe('Schema Validation', () => {
        it('should create a project label with valid data', async () => {
            const projectLabelData = {
                projectId: testProjectId,
                name: 'Bug',
                labelColorId: testLabelColorId,
            };

            const projectLabel = new ProjectLabel(projectLabelData);
            await projectLabel.save();

            expect(projectLabel._id).toBeDefined();
            expect(projectLabel.projectId).toBe(testProjectId);
            expect(projectLabel.name).toBe('Bug');
            expect(projectLabel.labelColorId).toBe(testLabelColorId);
            expect(projectLabel.createdDate).toBeDefined();
        });

        it('should require projectId', async () => {
            const projectLabel = new ProjectLabel({
                name: 'Bug',
                labelColorId: testLabelColorId,
            });

            await expect(projectLabel.save()).rejects.toThrow();
        });

        it('should require name', async () => {
            const projectLabel = new ProjectLabel({
                projectId: testProjectId,
                labelColorId: testLabelColorId,
            });

            await expect(projectLabel.save()).rejects.toThrow();
        });

        it('should require labelColorId', async () => {
            const projectLabel = new ProjectLabel({
                projectId: testProjectId,
                name: 'Bug',
            });

            await expect(projectLabel.save()).rejects.toThrow();
        });

        it('should enforce maximum name length', async () => {
            const longName = 'a'.repeat(51); // Max is 50

            const projectLabel = new ProjectLabel({
                projectId: testProjectId,
                name: longName,
                labelColorId: testLabelColorId,
            });

            await expect(projectLabel.save()).rejects.toThrow();
        });
    });
});
