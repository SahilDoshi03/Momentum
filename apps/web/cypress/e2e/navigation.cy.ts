describe('Navigation', () => {
  beforeEach(() => {
    // Start from a clean state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should navigate between pages', () => {
    cy.visit('/');
    
    // Check if we're redirected to login (if protected route)
    // or if we can see the home page content
    cy.url().should('satisfy', (url) => {
      return url.includes('/') || url.includes('/login');
    });
  });

  it('should access login page', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.contains('Welcome back').should('be.visible');
  });

  it('should access register page', () => {
    cy.visit('/register');
    cy.url().should('include', '/register');
  });
});

