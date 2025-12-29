describe('Chatbot Interaction', () => {
    beforeEach(() => {
        // Login before each test
        cy.loginAsTestUser();
        cy.visit('/');
    });

    it('should open and close the chat window', () => {
        // Check initial state
        cy.get('button[aria-label="Open chat"]').should('be.visible');
        cy.contains('Momentum Assistant').should('not.exist');

        // Open chat
        cy.get('button[aria-label="Open chat"]').click();
        cy.contains('Momentum Assistant').should('be.visible');
        cy.get('input[placeholder="Ask me anything..."]').should('be.visible');

        // Close chat
        cy.get('button[aria-label="Close chat"]').click();
        cy.contains('Momentum Assistant').should('not.exist');
    });

    it('should send a message and receive a response', () => {
        // Mock the API response
        cy.intercept('POST', '**/api/chat/message', (req) => {
            req.reply({
                statusCode: 200,
                body: {
                    success: true,
                    data: {
                        response: 'I can help with that!',
                        toolResults: []
                    }
                }
            });
        }).as('chatMessage');

        // Open chat
        cy.get('button[aria-label="Open chat"]').click();

        // Type and send message
        const message = 'Hello, can you help me?';
        cy.get('input[placeholder="Ask me anything..."]').type(message);
        cy.get('button[type="submit"]').click();

        // Verify user message appears immediately
        cy.contains(message).should('be.visible');

        // Verify "Thinking..." indicator
        cy.contains('Thinking...').should('be.visible');

        // Wait for API response
        cy.wait('@chatMessage');

        // Verify assistant response
        cy.contains('I can help with that!').should('be.visible');
        cy.contains('Thinking...').should('not.exist');
    });

    it('should handle tool execution results', () => {
        // Mock API response with tool results
        cy.intercept('POST', '**/api/chat/message', (req) => {
            req.reply({
                statusCode: 200,
                body: {
                    success: true,
                    data: {
                        response: 'I have created the project for you.',
                        toolResults: [{ action: 'create_project', status: 'success' }]
                    }
                }
            });
        }).as('chatToolMessage');

        cy.get('button[aria-label="Open chat"]').click();

        cy.get('input[placeholder="Ask me anything..."]').type('Create a new project named Alpha');
        cy.get('button[type="submit"]').click();

        cy.wait('@chatToolMessage');

        // Verify tool execution indicator
        cy.contains('✓ Performed 1 action').should('be.visible');
        cy.contains('I have created the project for you.').should('be.visible');
    });

    it('should handle API errors gracefully', () => {
        cy.intercept('POST', '**/api/chat/message', {
            statusCode: 500,
            body: {
                success: false,
                message: 'Internal Server Error'
            }
        }).as('chatError');

        cy.get('button[aria-label="Open chat"]').click();

        cy.get('input[placeholder="Ask me anything..."]').type('Trigger error');
        cy.get('button[type="submit"]').click();

        cy.wait('@chatError');

        // Verify error message in chat
        cy.contains('Sorry, I encountered an error').should('be.visible');
    });
});
