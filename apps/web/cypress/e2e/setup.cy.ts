/**
 * Cypress E2E Test Setup
 * 
 * This file should be run ONCE before running the E2E test suite
 * to set up test users in the database.
 * 
 * Run with: npx cypress run --spec "cypress/e2e/setup.cy.ts"
 */

describe('Test Setup', () => {
    it('should create test users', () => {
        cy.fixture('users').then((users) => {
            // Register test user
            cy.visit('/register');
            cy.get('input[placeholder*="first name"]').type(users.testUser.firstName);
            cy.get('input[placeholder*="last name"]').type(users.testUser.lastName);
            cy.get('input[type="email"]').type(users.testUser.email);
            cy.get('input[placeholder="Create a password"]').type(users.testUser.password);
            cy.get('input[placeholder="Confirm your password"]').type(users.testUser.password);
            cy.get('button[type="submit"]').click();

            // Should redirect to home
            cy.url().should('not.include', '/register', { timeout: 10000 });

            // Logout
            cy.clearLocalStorage();
            cy.clearCookies();

            // Register second user
            cy.visit('/register');
            cy.get('input[placeholder*="first name"]').type(users.secondUser.firstName);
            cy.get('input[placeholder*="last name"]').type(users.secondUser.lastName);
            cy.get('input[type="email"]').type(users.secondUser.email);
            cy.get('input[placeholder="Create a password"]').type(users.secondUser.password);
            cy.get('input[placeholder="Confirm your password"]').type(users.secondUser.password);
            cy.get('button[type="submit"]').click();

            cy.url().should('not.include', '/register', { timeout: 10000 });

            cy.clearLocalStorage();
            cy.clearCookies();

            // Register team member
            cy.visit('/register');
            cy.get('input[placeholder*="first name"]').type(users.teamMember.firstName);
            cy.get('input[placeholder*="last name"]').type(users.teamMember.lastName);
            cy.get('input[type="email"]').type(users.teamMember.email);
            cy.get('input[placeholder="Create a password"]').type(users.teamMember.password);
            cy.get('input[placeholder="Confirm your password"]').type(users.teamMember.password);
            cy.get('button[type="submit"]').click();

            cy.url().should('not.include', '/register', { timeout: 10000 });

            cy.log('✅ All test users created successfully!');
        });
    });
});
