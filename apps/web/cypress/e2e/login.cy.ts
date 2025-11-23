describe('Login Page', () => {
  beforeEach(() => {
    // Clear any existing session
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display login form', () => {
    cy.visit('/login');
    
    // Check for login form elements
    cy.contains('Welcome back').should('be.visible');
    cy.contains('Sign in to your account').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation error for empty form submission', () => {
    cy.visit('/login');
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click();
    
    // HTML5 validation should prevent submission
    cy.get('input[type="email"]:invalid').should('exist');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');
    
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Wait for error message (adjust selector based on your error display)
    cy.contains('Invalid credentials', { timeout: 10000 }).should('be.visible');
  });

  it('should navigate to register page', () => {
    cy.visit('/login');
    
    cy.contains('Sign up').click();
    cy.url().should('include', '/register');
  });

  it('should redirect to home if already logged in', () => {
    // This test assumes you have a way to set up authenticated state
    // You may need to mock the API or use actual credentials
    cy.visit('/login');
    
    // If user is already logged in, they should be redirected
    // This depends on your auth implementation
  });
});

