describe('Authentication Flow', () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.clearCookies();
    });

    describe('Registration', () => {
        it('should display registration form', () => {
            cy.visit('/register');

            cy.contains('Create your account').should('be.visible');
            cy.get('input[name="fullName"]').should('be.visible');
            cy.get('input[type="email"]').should('be.visible');
            cy.get('input[type="password"]').should('be.visible');
            cy.get('button[type="submit"]').should('be.visible');
        });

        it('should validate required fields', () => {
            cy.visit('/register');

            cy.get('button[type="submit"]').click();
            cy.get('input[name="fullName"]:invalid').should('exist');
        });

        it('should validate email format', () => {
            cy.visit('/register');

            cy.get('input[name="fullName"]').type('Test User');
            cy.get('input[type="email"]').type('invalid-email');
            cy.get('input[type="password"]').type('Password123!');
            cy.get('button[type="submit"]').click();

            cy.get('input[type="email"]:invalid').should('exist');
        });

        it('should register a new user successfully', () => {
            const timestamp = Date.now();
            const newUser = {
                fullName: 'New Test User',
                email: `newuser${timestamp}@test.com`,
                password: 'NewUser123!@#',
            };

            cy.visit('/register');

            cy.get('input[name="fullName"]').type(newUser.fullName);
            cy.get('input[type="email"]').type(newUser.email);
            cy.get('input[type="password"]').type(newUser.password);
            cy.get('button[type="submit"]').click();

            // Should redirect to home page after successful registration
            cy.url().should('not.include', '/register');
            cy.url().should('eq', `${Cypress.config().baseUrl}/`);
        });

        it('should show error for duplicate email', () => {
            cy.fixture('users').then((users) => {
                cy.visit('/register');

                cy.get('input[name="fullName"]').type('Duplicate User');
                cy.get('input[type="email"]').type(users.testUser.email);
                cy.get('input[type="password"]').type('Password123!');
                cy.get('button[type="submit"]').click();

                cy.contains(/already exists|already registered/i, { timeout: 10000 }).should('be.visible');
            });
        });

        it('should navigate to login page', () => {
            cy.visit('/register');

            cy.contains('Sign in').click();
            cy.url().should('include', '/login');
        });
    });

    describe('Login', () => {
        it('should display login form', () => {
            cy.visit('/login');

            cy.contains('Welcome back').should('be.visible');
            cy.get('input[type="email"]').should('be.visible');
            cy.get('input[type="password"]').should('be.visible');
            cy.get('button[type="submit"]').should('be.visible');
        });

        it('should validate required fields', () => {
            cy.visit('/login');

            cy.get('button[type="submit"]').click();
            cy.get('input[type="email"]:invalid').should('exist');
        });

        it('should show error for invalid credentials', () => {
            cy.visit('/login');

            cy.get('input[type="email"]').type('invalid@example.com');
            cy.get('input[type="password"]').type('wrongpassword');
            cy.get('button[type="submit"]').click();

            cy.contains(/invalid|incorrect|wrong/i, { timeout: 10000 }).should('be.visible');
        });

        it('should login successfully with valid credentials', () => {
            cy.fixture('users').then((users) => {
                cy.login(users.testUser.email, users.testUser.password);

                // Should be on home page
                cy.url().should('eq', `${Cypress.config().baseUrl}/`);

                // User should be authenticated
                cy.window().then((win) => {
                    const user = JSON.parse(win.localStorage.getItem('currentUser') || '{}');
                    expect(user.email).to.equal(users.testUser.email);
                });
            });
        });

        it('should navigate to register page', () => {
            cy.visit('/login');

            cy.contains('Sign up').click();
            cy.url().should('include', '/register');
        });

        it('should display Google OAuth button', () => {
            cy.visit('/login');

            cy.contains('button', /continue with google/i).should('be.visible');
        });
    });

    describe('Logout', () => {
        beforeEach(() => {
            cy.loginAsTestUser();
        });

        it('should logout successfully', () => {
            cy.logout();

            // Should redirect to login page
            cy.url().should('include', '/login');

            // localStorage should be cleared
            cy.window().then((win) => {
                expect(win.localStorage.getItem('currentUser')).to.be.null;
                expect(win.localStorage.getItem('authToken')).to.be.null;
            });
        });

        it('should not access protected routes after logout', () => {
            cy.logout();

            // Try to visit a protected route
            cy.visit('/');
            cy.url().should('include', '/login');
        });
    });

    describe('Session Persistence', () => {
        it('should maintain session across page reloads', () => {
            cy.loginAsTestUser();

            cy.reload();

            // Should still be logged in
            cy.url().should('not.include', '/login');
            cy.window().then((win) => {
                expect(win.localStorage.getItem('currentUser')).to.not.be.null;
            });
        });

        it('should maintain session across navigation', () => {
            cy.loginAsTestUser();

            cy.visit('/');
            cy.url().should('not.include', '/login');

            // Navigate to different pages
            cy.visit('/profile');
            cy.url().should('include', '/profile');

            cy.visit('/');
            cy.url().should('not.include', '/login');
        });
    });

    describe('Protected Routes', () => {
        it('should redirect to login when accessing protected route without auth', () => {
            cy.visit('/');
            cy.url().should('include', '/login');

            cy.visit('/profile');
            cy.url().should('include', '/login');

            cy.visit('/project/123');
            cy.url().should('include', '/login');
        });

        it('should allow access to protected routes when authenticated', () => {
            cy.loginAsTestUser();

            cy.visit('/');
            cy.url().should('not.include', '/login');

            cy.visit('/profile');
            cy.url().should('include', '/profile');
        });

        it('should allow access to public routes without auth', () => {
            cy.visit('/login');
            cy.url().should('include', '/login');

            cy.visit('/register');
            cy.url().should('include', '/register');
        });
    });
});
