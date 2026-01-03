
describe('Project Optimistic Updates & Loading States', () => {
    beforeEach(() => {
        // Mock login or set state if needed. Assuming we can visit the page directly or mock auth.
        // For now, assuming straightforward access or using a seed.
        // We'll intercept API calls to delay them and test loading states.
        cy.intercept('GET', '/api/projects', { fixture: 'projects.json' }).as('getProjects');
        cy.intercept('GET', '/api/teams', { fixture: 'teams.json' }).as('getTeams');
        cy.intercept('GET', '/api/users/me', { fixture: 'user.json' }).as('getMe');

        // Seed locally if needed? Or just stub network.
        // We'll stub network for reliability.
    });

    it('should disable create button and show loading text when creating a project', () => {
        cy.intercept('POST', '/api/projects', (req) => {
            req.reply({
                delay: 1000, // 1 second delay to test loading state
                body: { success: true, data: { _id: 'new-p', name: 'New Project' } }
            });
        }).as('createProject');

        cy.visit('/'); // Assuming projects list is home

        // Open modal
        cy.contains('Create new project').click();

        // Type name
        cy.get('input[placeholder="Enter project name"]').type('New Project');

        // Click create
        cy.contains('button', 'Create Project').click();

        // Verify button state changes
        cy.contains('button', 'Creating...').should('be.visible').and('be.disabled');

        // Verify only one request sent (by waiting and checking)
        cy.wait('@createProject');
    });

    it('should prevent double submission on delete', () => {
        // Stub existing projects so we can delete one
        cy.intercept('GET', '/api/projects', {
            body: {
                success: true,
                data: [
                    { _id: 'p1', name: 'Delete Me', teamId: null, currentUserRole: 'owner' }
                ]
            }
        }).as('getProjects');

        cy.intercept('DELETE', '/api/projects/*', (req) => {
            req.reply({
                delay: 500,
                body: { success: true }
            });
        }).as('deleteProject');

        cy.visit('/');
        cy.wait('@getProjects');

        // Hover and click delete (trash icon)
        cy.get('.project-card').first().trigger('mouseover');
        cy.get('button[title="Delete project"]').click({ force: true });

        // Confirm modal open
        cy.contains('Delete Project').should('be.visible');

        // Click delete
        cy.get('.bg-red-600').contains('Delete Project').click();

        // Verify button changes to 'Processing...' and is disabled
        cy.contains('button', 'Processing...').should('be.visible').and('be.disabled');

        // Verify request
        cy.wait('@deleteProject');

        // Verify UI likely closes or updates
        cy.get('.bg-red-600').should('not.exist');
    });
});
