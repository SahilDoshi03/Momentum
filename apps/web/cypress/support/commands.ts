/// <reference types="cypress" />

// ***********************************************
// Custom commands for Momentum E2E tests
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      loginAsTestUser(): Chainable<void>;
      registerUser(userData: { email: string; password: string; fullName: string }): Chainable<void>;

      // Project operations
      createProject(projectName: string, teamId?: string): Chainable<void>;
      deleteProject(projectName: string): Chainable<void>;
      openProject(projectName: string): Chainable<void>;

      // Task operations
      createTask(listName: string, taskName: string): Chainable<void>;
      openTaskDetail(taskName: string): Chainable<void>;
      deleteTask(taskName: string): Chainable<void>;
      markTaskComplete(taskName: string): Chainable<void>;

      // Team operations
      createTeam(teamName: string): Chainable<void>;
      addTeamMember(teamName: string, userEmail: string): Chainable<void>;

      // UI helpers
      waitForPageLoad(): Chainable<void>;
      dismissToast(): Chainable<void>;
      openUserMenu(): Chainable<void>;
      toggleTheme(): Chainable<void>;
    }
  }
}

/**
 * Login with email and password
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"], input[name="email"]').type(email);
  cy.get('input[type="password"], input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
  cy.waitForPageLoad();
});

/**
 * Login as the default test user
 */
Cypress.Commands.add('loginAsTestUser', () => {
  cy.fixture('users').then((users) => {
    cy.login(users.testUser.email, users.testUser.password);
  });
});

/**
 * Register a new user
 */
Cypress.Commands.add('registerUser', (userData) => {
  cy.visit('/register');
  cy.get('input[name="fullName"]').type(userData.fullName);
  cy.get('input[type="email"], input[name="email"]').type(userData.email);
  cy.get('input[type="password"], input[name="password"]').type(userData.password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/register');
});

/**
 * Logout the current user
 */
Cypress.Commands.add('logout', () => {
  cy.openUserMenu();
  cy.contains('Logout').click();
  cy.url().should('include', '/login');
});

/**
 * Create a new project
 */
Cypress.Commands.add('createProject', (projectName: string, teamId?: string) => {
  cy.visit('/');
  cy.contains('button', 'New Project').click();
  cy.get('input[name="name"], input[placeholder*="Project"]').type(projectName);

  if (teamId) {
    cy.get('select[name="team"]').select(teamId);
  }

  cy.contains('button', 'Create').click();
  cy.contains(projectName).should('be.visible');
});

/**
 * Delete a project
 */
Cypress.Commands.add('deleteProject', (projectName: string) => {
  cy.contains(projectName).should('be.visible');
  cy.contains(projectName).rightclick();
  cy.contains('Delete').click();
  cy.contains('button', 'Confirm').click();
  cy.contains(projectName).should('not.exist');
});

/**
 * Open a project by name
 */
Cypress.Commands.add('openProject', (projectName: string) => {
  cy.visit('/');
  cy.contains(projectName).click();
  cy.url().should('include', '/project/');
  cy.waitForPageLoad();
});

/**
 * Create a task in a specific list
 */
Cypress.Commands.add('createTask', (listName: string, taskName: string) => {
  // Find the list and click "Add a card" or similar
  cy.contains(listName).parent().parent().within(() => {
    cy.contains('Add').click();
    cy.get('textarea, input').type(taskName);
    cy.contains('button', 'Add').click();
  });
  cy.contains(taskName).should('be.visible');
});

/**
 * Open task detail modal
 */
Cypress.Commands.add('openTaskDetail', (taskName: string) => {
  cy.contains(taskName).click();
  cy.get('[role="dialog"], .modal').should('be.visible');
});

/**
 * Delete a task
 */
Cypress.Commands.add('deleteTask', (taskName: string) => {
  cy.openTaskDetail(taskName);
  cy.contains('button', 'Delete').click();
  cy.contains('button', 'Confirm').click();
  cy.contains(taskName).should('not.exist');
});

/**
 * Mark a task as complete
 */
Cypress.Commands.add('markTaskComplete', (taskName: string) => {
  cy.contains(taskName).parent().within(() => {
    cy.get('[type="checkbox"], button').first().click();
  });
});

/**
 * Create a new team
 */
Cypress.Commands.add('createTeam', (teamName: string) => {
  cy.visit('/');
  cy.contains('button', 'New Team').click();
  cy.get('input[name="name"]').type(teamName);
  cy.contains('button', 'Create').click();
  cy.contains(teamName).should('be.visible');
});

/**
 * Add a member to a team
 */
Cypress.Commands.add('addTeamMember', (teamName: string, userEmail: string) => {
  cy.contains(teamName).click();
  cy.contains('Members').click();
  cy.contains('button', 'Add Member').click();
  cy.get('input[type="email"]').type(userEmail);
  cy.contains('button', 'Add').click();
  cy.contains(userEmail).should('be.visible');
});

/**
 * Wait for page to fully load
 */
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  // Wait for any loading spinners to disappear
  cy.get('[data-testid="loading"], .loading, .spinner', { timeout: 10000 }).should('not.exist');
});

/**
 * Dismiss any visible toast notifications
 */
Cypress.Commands.add('dismissToast', () => {
  cy.get('.Toastify__toast', { timeout: 1000 }).then(($toast) => {
    if ($toast.length) {
      cy.wrap($toast).click();
    }
  });
});

/**
 * Open the user menu
 */
Cypress.Commands.add('openUserMenu', () => {
  cy.get('[data-testid="user-menu"], button[aria-label*="user"]').click();
});

/**
 * Toggle between light and dark theme
 */
Cypress.Commands.add('toggleTheme', () => {
  cy.get('[data-testid="theme-toggle"], button[aria-label*="theme"]').click();
});

export { };
