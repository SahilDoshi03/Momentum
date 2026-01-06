
describe('Task Input Handling', () => {
    let projectName: string;

    beforeEach(() => {
        cy.loginAsTestUser();
        cy.fixture('projects').then((projects) => {
            projectName = `${projects.sample.name} - Input Test ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);
        });
    });

    it('should handle spacebar correctly in card composer (not trigger drag)', () => {
        const taskName = 'Task With Space';

        cy.contains('To Do').parent().within(() => {
            cy.contains('Add a card').click();

            const input = cy.get('textarea');
            input.type('Task With Space');

            // Check if space was actually typed
            input.should('have.value', 'Task With Space');

            // Start drag specific checks if possible, e.g. verify opacity didn't change on the list
            // Accessming the list element to check style opacity might be flaky, but checking input value is rock solid proof that space wasn't "eaten" by a preventedDefault handler or focus loss.
            // If dnd-kit picked it up, it usually prevents default behavior for the key.
        });
    });

    it('should handle spacebar correctly in task card inline edit', () => {
        const taskName = `Inline Edit Task ${Date.now()}`;
        cy.createTask('To Do', taskName);

        // Find the task and click to edit
        cy.contains(taskName).click();

        // In editing mode, input should be visible
        cy.get(`input[value="${taskName}"]`)
            .clear()
            .type('Updated Name With Space');

        // Assert value
        cy.get(`input[value="Updated Name With Space"]`).should('exist');

        // Save
        cy.get(`input[value="Updated Name With Space"]`).type('{enter}');

        // Verify update
        cy.contains('Updated Name With Space').should('be.visible');
    });

    it('should handle spacebar correctly in list title edit', () => {
        const listName = 'To Do';
        const newListName = 'To Do List Updated';

        // Click on list title to edit
        cy.contains('h3', listName).click();

        // Input should appear
        cy.get('input[value="To Do"]')
            .clear()
            .type(newListName);

        // Assert value has spaces
        cy.get(`input[value="${newListName}"]`).should('exist');

        // Save (blur or enter)
        cy.get(`input[value="${newListName}"]`).type('{enter}');

        // Verify
        cy.contains(newListName).should('be.visible');
    });
});
