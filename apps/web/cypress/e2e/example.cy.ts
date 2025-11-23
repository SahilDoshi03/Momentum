describe('Example E2E Test', () => {
  it('should visit the home page', () => {
    cy.visit('/');
    cy.contains('Welcome'); // Adjust based on your actual home page content
  });
});

