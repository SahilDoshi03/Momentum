/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Custom command to login a user
 * @param email - User email
 * @param password - User password
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"], input[name="email"]').type(email);
  cy.get('input[type="password"], input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  // Wait for navigation or success indicator
  cy.url().should('not.include', '/login');
});

/**
 * Custom command to logout a user
 */
Cypress.Commands.add('logout', () => {
  // Clear localStorage
  cy.clearLocalStorage();
  // Clear cookies
  cy.clearCookies();
  // Visit home to ensure we're logged out
  cy.visit('/');
});

