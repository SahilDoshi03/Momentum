describe('Task Details Modal', () => {
    beforeEach(() => {
        // Register a new user to ensure we have access
        const email = `testuser${Date.now()}@example.com`;
        const password = 'password123';

        cy.visit('/register');
        cy.get('input[name="fullName"]').type('Test User');
        cy.get('input[name="email"]').type(email);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();

        // Should be redirected to dashboard or login
        // If login, then login
        cy.url().then((url) => {
            if (url.includes('/login')) {
                cy.login(email, password);
            }
        });

        // Create a project if needed or select one
        // Assuming dashboard shows projects or empty state
        // We need to ensure we are on a project board
        cy.wait(1000); // Wait for potential redirects

        // If we are on dashboard, create a project
        cy.get('body').then(($body) => {
            if ($body.find('button:contains("Create Project")').length > 0) {
                cy.contains('Create Project').click();
                cy.get('input[placeholder="Project Name"]').type('Test Project');
                cy.contains('Create').click();
            } else if ($body.find('.project-card').length > 0) {
                cy.get('.project-card').first().click();
            }
        });
    });

    it('allows editing task details', () => {
        // Create a task first to ensure one exists
        const taskName = `Test Task ${Date.now()}`;
        cy.contains('Add a card').first().click();
        cy.get('textarea[placeholder="Enter a title for this card..."]').type(`${taskName}{enter}`);

        // Click on the task to open modal
        cy.contains(taskName).click();

        // Verify modal is open
        cy.get('input[value="' + taskName + '"]').should('be.visible');

        // Edit Title
        const newTaskName = `${taskName} Updated`;
        cy.get('input[value="' + taskName + '"]').clear().type(`${newTaskName}`).blur();

        // Edit Description
        cy.contains('Add a more detailed description...').click();
        cy.get('textarea[placeholder="Add a more detailed description..."]').type('This is a test description');
        cy.contains('Save').click();
        cy.contains('This is a test description').should('be.visible');

        // Set Due Date
        // Date input format depends on browser/locale, but usually YYYY-MM-DD works for value
        const today = new Date().toISOString().split('T')[0];
        cy.get('input[type="date"]').type(today);

        // Toggle Complete
        cy.contains('Mark Complete').click();
        cy.contains('Completed').should('be.visible');

        // Close Modal
        cy.get('body').click(0, 0); // Click outside or use close button if available
        // We didn't add a close button explicitly in the modal content, but Modal component has one?
        // Modal.tsx has a close button if title is provided, but we didn't provide title prop to Modal component in TaskDetailModal.
        // But Modal has a backdrop click handler.

        // Verify changes on board
        cy.contains(newTaskName).should('be.visible');
        // Verify completion status (opacity or icon)
        cy.contains(newTaskName).parents('.group').should('have.class', 'opacity-60');
    });
});
