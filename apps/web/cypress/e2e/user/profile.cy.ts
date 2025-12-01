describe('User Profile', () => {
    beforeEach(() => {
        cy.loginAsTestUser();
    });

    describe('Profile Page', () => {
        it('should navigate to profile page', () => {
            cy.visit('/');

            cy.openUserMenu();
            cy.contains('Profile').click();

            cy.url().should('include', '/profile');
        });

        it('should display user information', () => {
            cy.fixture('users').then((users) => {
                cy.visit('/profile');

                cy.contains(users.testUser.fullName).should('be.visible');
                cy.contains(users.testUser.email).should('be.visible');
            });
        });

        it('should display user initials', () => {
            cy.fixture('users').then((users) => {
                cy.visit('/profile');

                cy.contains(users.testUser.initials).should('be.visible');
            });
        });
    });

    describe('Profile Editing', () => {
        beforeEach(() => {
            cy.visit('/profile');
        });

        it('should enable edit mode', () => {
            cy.contains('button', 'Edit').click();

            cy.get('input[name="fullName"]').should('not.be.disabled');
            cy.contains('button', 'Save').should('be.visible');
            cy.contains('button', 'Cancel').should('be.visible');
        });

        it('should update full name', () => {
            const newName = `Updated Name ${Date.now()}`;

            cy.contains('button', 'Edit').click();

            cy.get('input[name="fullName"]').clear().type(newName);
            cy.contains('button', 'Save').click();

            cy.contains(newName, { timeout: 10000 }).should('be.visible');
        });

        it('should cancel editing', () => {
            cy.fixture('users').then((users) => {
                cy.contains('button', 'Edit').click();

                cy.get('input[name="fullName"]').clear().type('Cancelled Name');
                cy.contains('button', 'Cancel').click();

                // Should revert to original name
                cy.contains(users.testUser.fullName).should('be.visible');
                cy.contains('Cancelled Name').should('not.exist');
            });
        });

        it('should validate required fields', () => {
            cy.contains('button', 'Edit').click();

            cy.get('input[name="fullName"]').clear();
            cy.contains('button', 'Save').click();

            cy.get('input[name="fullName"]:invalid').should('exist');
        });

        it('should update initials when name changes', () => {
            cy.contains('button', 'Edit').click();

            cy.get('input[name="fullName"]').clear().type('John Doe');
            cy.contains('button', 'Save').click();

            cy.contains('JD', { timeout: 10000 }).should('be.visible');
        });
    });

    describe('Avatar/Profile Picture', () => {
        beforeEach(() => {
            cy.visit('/profile');
        });

        it('should display profile icon with initials', () => {
            cy.fixture('users').then((users) => {
                cy.get('[data-testid="profile-icon"]').should('contain', users.testUser.initials);
            });
        });

        it('should update initials display after name change', () => {
            cy.contains('button', 'Edit').click();
            cy.get('input[name="fullName"]').clear().type('Alice Bob');
            cy.contains('button', 'Save').click();

            cy.get('[data-testid="profile-icon"]').should('contain', 'AB');
        });
    });

    describe('Email Display', () => {
        it('should display email as read-only', () => {
            cy.visit('/profile');

            cy.contains('button', 'Edit').click();

            cy.fixture('users').then((users) => {
                cy.get('input[value="' + users.testUser.email + '"]').should('be.disabled');
            });
        });

        it('should show email cannot be changed message', () => {
            cy.visit('/profile');

            cy.contains(/email cannot be changed|email is permanent/i).should('be.visible');
        });
    });

    describe('Profile Data Persistence', () => {
        it('should persist profile changes across sessions', () => {
            const newName = `Persistent Name ${Date.now()}`;

            cy.visit('/profile');
            cy.contains('button', 'Edit').click();
            cy.get('input[name="fullName"]').clear().type(newName);
            cy.contains('button', 'Save').click();

            // Logout and login again
            cy.logout();
            cy.loginAsTestUser();

            cy.visit('/profile');
            cy.contains(newName).should('be.visible');
        });

        it('should update user menu display name', () => {
            const newName = `Menu Name ${Date.now()}`;

            cy.visit('/profile');
            cy.contains('button', 'Edit').click();
            cy.get('input[name="fullName"]').clear().type(newName);
            cy.contains('button', 'Save').click();

            cy.visit('/');
            cy.openUserMenu();

            cy.contains(newName).should('be.visible');
        });
    });

    describe('Profile Navigation', () => {
        it('should navigate back to home', () => {
            cy.visit('/profile');

            cy.get('[data-testid="breadcrumb"], nav').within(() => {
                cy.contains('Home').click();
            });

            cy.url().should('eq', `${Cypress.config().baseUrl}/`);
        });

        it('should access profile from user menu', () => {
            cy.visit('/');

            cy.openUserMenu();
            cy.contains('Profile').click();

            cy.url().should('include', '/profile');
        });
    });

    describe('Profile Error Handling', () => {
        it('should show error on save failure', () => {
            cy.visit('/profile');

            // Intercept API call to simulate error
            cy.intercept('PUT', '**/api/users/**', {
                statusCode: 500,
                body: { error: 'Server error' },
            }).as('updateProfile');

            cy.contains('button', 'Edit').click();
            cy.get('input[name="fullName"]').clear().type('Error Name');
            cy.contains('button', 'Save').click();

            cy.wait('@updateProfile');
            cy.contains(/error|failed/i, { timeout: 10000 }).should('be.visible');
        });

        it('should handle network errors gracefully', () => {
            cy.visit('/profile');

            cy.intercept('PUT', '**/api/users/**', { forceNetworkError: true }).as('networkError');

            cy.contains('button', 'Edit').click();
            cy.get('input[name="fullName"]').clear().type('Network Error');
            cy.contains('button', 'Save').click();

            cy.wait('@networkError');
            cy.contains(/network|connection/i, { timeout: 10000 }).should('be.visible');
        });
    });
});
