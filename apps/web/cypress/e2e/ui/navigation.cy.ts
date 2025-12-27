describe('Navigation and UI', () => {
    beforeEach(() => {
        cy.loginAsTestUser();
    });

    describe('Sidebar Navigation', () => {
        it('should display sidebar', () => {
            cy.visit('/');

            cy.get('[data-testid="sidebar"], aside, nav').should('be.visible');
        });

        it('should navigate to home', () => {
            cy.visit('/profile');

            cy.get('[data-testid="sidebar"]').within(() => {
                cy.contains('Home').click();
            });

            cy.url().should('eq', `${Cypress.config().baseUrl}/`);
        });

        it('should navigate to My Tasks', () => {
            cy.visit('/');

            cy.contains('My Tasks').click();

            cy.url().should('include', '/my-tasks');
        });

        it('should highlight active navigation item', () => {
            cy.visit('/my-tasks');

            cy.contains('My Tasks').should('have.class', /active|selected/);
        });

        it('should show projects section', () => {
            cy.visit('/');

            cy.get('[data-testid="sidebar"]').within(() => {
                cy.contains('Projects').should('be.visible');
            });
        });

        it('should show teams section', () => {
            cy.visit('/');

            cy.get('[data-testid="sidebar"]').within(() => {
                cy.contains('Teams').should('be.visible');
            });
        });

        it('should collapse and expand sidebar', () => {
            cy.visit('/');

            cy.get('[data-testid="sidebar-toggle"], button[aria-label*="sidebar"]').click();

            // Sidebar should be collapsed
            cy.get('[data-testid="sidebar"]').should('have.class', /collapsed|minimized/);

            cy.get('[data-testid="sidebar-toggle"]').click();

            // Sidebar should be expanded
            cy.get('[data-testid="sidebar"]').should('not.have.class', /collapsed|minimized/);
        });
    });

    describe('Breadcrumbs', () => {
        it('should display breadcrumbs on project page', () => {
            const projectName = `Breadcrumb Project ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);

            cy.get('[data-testid="breadcrumb"], nav[aria-label="breadcrumb"]').should('be.visible');
            cy.contains('Projects').should('be.visible');
            cy.contains(projectName).should('be.visible');
        });

        it('should navigate using breadcrumbs', () => {
            const projectName = `Nav Project ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);

            cy.get('[data-testid="breadcrumb"]').within(() => {
                cy.contains('Projects').click();
            });

            cy.url().should('eq', `${Cypress.config().baseUrl}/`);
        });

        it('should display breadcrumbs on team page', () => {
            const teamName = `Breadcrumb Team ${Date.now()}`;
            cy.createTeam(teamName);
            cy.contains(teamName).click();

            cy.get('[data-testid="breadcrumb"]').should('be.visible');
            cy.contains('Teams').should('be.visible');
            cy.contains(teamName).should('be.visible');
        });

        it('should display breadcrumbs on profile page', () => {
            cy.visit('/profile');

            cy.get('[data-testid="breadcrumb"]').should('be.visible');
            cy.contains('Profile').should('be.visible');
        });
    });

    describe('Theme Toggle', () => {
        it('should toggle between light and dark theme', () => {
            cy.visit('/');

            // Get current theme
            cy.get('html').invoke('attr', 'class').then((currentTheme) => {
                cy.toggleTheme();

                // Theme should change
                cy.get('html').invoke('attr', 'class').should('not.equal', currentTheme);
            });
        });

        it('should persist theme preference', () => {
            cy.visit('/');

            cy.toggleTheme();

            // Get theme
            cy.get('html').invoke('attr', 'class').then((theme) => {
                cy.reload();

                // Theme should persist
                cy.get('html').invoke('attr', 'class').should('equal', theme);
            });
        });

        it('should display theme toggle button', () => {
            cy.visit('/');

            cy.get('[data-testid="theme-toggle"], button[aria-label*="theme"]').should('be.visible');
        });
    });

    describe('User Menu', () => {
        it('should open user menu', () => {
            cy.visit('/');

            cy.openUserMenu();

            cy.get('[data-testid="user-menu"], [role="menu"]').should('be.visible');
        });

        it('should display user name in menu', () => {
            cy.visit('/');

            cy.openUserMenu();

            cy.fixture('users').then((users) => {
                cy.contains(users.testUser.fullName).should('be.visible');
            });
        });

        it('should display user email in menu', () => {
            cy.visit('/');

            cy.openUserMenu();

            cy.fixture('users').then((users) => {
                cy.contains(users.testUser.email).should('be.visible');
            });
        });

        it('should navigate to profile from menu', () => {
            cy.visit('/');

            cy.openUserMenu();
            cy.contains('Profile').click();

            cy.url().should('include', '/profile');
        });

        it('should logout from menu', () => {
            cy.visit('/');

            cy.logout();

            cy.url().should('include', '/login');
        });

        it('should close menu when clicking outside', () => {
            cy.visit('/');

            cy.openUserMenu();

            cy.get('body').click('topLeft');

            cy.get('[data-testid="user-menu"]').should('not.exist');
        });
    });

    describe('Top Navigation Bar', () => {
        it('should display top navbar', () => {
            cy.visit('/');

            cy.get('[data-testid="topnav"], header').should('be.visible');
        });

        it('should display project name in navbar when on project page', () => {
            const projectName = `Navbar Project ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);

            cy.get('[data-testid="topnav"]').within(() => {
                cy.contains(projectName).should('be.visible');
            });
        });

        it('should display team name in navbar when on team page', () => {
            const teamName = `Navbar Team ${Date.now()}`;
            cy.createTeam(teamName);
            cy.contains(teamName).click();

            cy.get('[data-testid="topnav"]').within(() => {
                cy.contains(teamName).should('be.visible');
            });
        });
    });

    describe('Responsive Design', () => {
        it('should display mobile menu on small screens', () => {
            cy.viewport('iphone-x');
            cy.visit('/');

            cy.get('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"]').should('be.visible');
        });

        it('should open mobile menu', () => {
            cy.viewport('iphone-x');
            cy.visit('/');

            cy.get('[data-testid="mobile-menu-toggle"]').click();

            cy.get('[data-testid="mobile-menu"]').should('be.visible');
        });

        it('should hide sidebar on mobile by default', () => {
            cy.viewport('iphone-x');
            cy.visit('/');

            cy.get('[data-testid="sidebar"]').should('not.be.visible');
        });

        it('should display correctly on tablet', () => {
            cy.viewport('ipad-2');
            cy.visit('/');

            cy.get('[data-testid="sidebar"]').should('be.visible');
        });

        it('should display correctly on desktop', () => {
            cy.viewport(1920, 1080);
            cy.visit('/');

            cy.get('[data-testid="sidebar"]').should('be.visible');
            cy.get('[data-testid="topnav"]').should('be.visible');
        });
    });

    describe('Loading States', () => {
        it('should show loading spinner when navigating', () => {
            cy.visit('/');

            // Intercept to delay response
            cy.intercept('GET', '**/api/projects', (req) => {
                req.reply((res) => {
                    res.delay = 1000;
                });
            }).as('getProjects');

            cy.reload();

            cy.get('[data-testid="loading"], .loading, .spinner').should('be.visible');
            cy.wait('@getProjects');
            cy.get('[data-testid="loading"]').should('not.exist');
        });

        it('should show skeleton loaders for content', () => {
            cy.visit('/');

            cy.intercept('GET', '**/api/projects', (req) => {
                req.reply((res) => {
                    res.delay = 1000;
                });
            });

            cy.reload();

            cy.get('[data-testid="skeleton"], .skeleton').should('exist');
        });
    });

    describe('Error States', () => {
        it('should display error message on API failure', () => {
            cy.visit('/');

            cy.intercept('GET', '**/api/projects', {
                statusCode: 500,
                body: { error: 'Server error' },
            });

            cy.reload();

            cy.contains(/error|failed|something went wrong/i, { timeout: 10000 }).should('be.visible');
        });

        it('should display 404 page for invalid routes', () => {
            cy.visit('/invalid-route-12345', { failOnStatusCode: false });

            cy.contains(/404|not found/i).should('be.visible');
        });

        it('should allow retry on error', () => {
            cy.visit('/');

            cy.intercept('GET', '**/api/projects', {
                statusCode: 500,
            }).as('failedRequest');

            cy.reload();
            cy.wait('@failedRequest');

            cy.contains('button', /retry|try again/i).click();

            cy.wait('@failedRequest');
        });
    });

    describe('Keyboard Navigation', () => {
        it.skip('should navigate using tab key', () => {
            // Skipped: cypress-plugin-tab is not installed
            // cy.visit('/');
            // cy.get('body').tab();
            // cy.focused().should('be.visible');
        });

        it('should close modals with escape key', () => {
            cy.visit('/');

            cy.contains('button', 'New Project').click();
            cy.get('[role="dialog"]').should('be.visible');

            cy.get('body').type('{esc}');
            cy.get('[role="dialog"]').should('not.exist');
        });

        it('should submit forms with enter key', () => {
            cy.visit('/');

            cy.contains('button', 'New Project').click();
            cy.get('input[name="name"]').type('Keyboard Project{enter}');

            cy.contains('Keyboard Project', { timeout: 10000 }).should('be.visible');
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', () => {
            cy.visit('/');

            cy.get('h1').should('exist');
        });

        it('should have alt text for images', () => {
            cy.visit('/');

            cy.get('img').each(($img) => {
                cy.wrap($img).should('have.attr', 'alt');
            });
        });

        it('should have aria labels for interactive elements', () => {
            cy.visit('/');

            cy.get('button[aria-label]').should('exist');
        });

        it('should have proper focus indicators', () => {
            cy.visit('/');

            cy.get('button').first().focus();
            cy.focused().should('have.css', 'outline').and('not.equal', 'none');
        });
    });

    describe('Toast Notifications', () => {
        it('should display success toast', () => {
            const projectName = `Toast Project ${Date.now()}`;
            cy.createProject(projectName);

            cy.contains(/created|success/i).should('be.visible');
        });

        it('should auto-dismiss toast after timeout', () => {
            const projectName = `Auto Dismiss ${Date.now()}`;
            cy.createProject(projectName);

            cy.contains(/created|success/i).should('be.visible');
            cy.wait(5000);
            cy.contains(/created|success/i).should('not.exist');
        });

        it('should manually dismiss toast', () => {
            const projectName = `Manual Dismiss ${Date.now()}`;
            cy.createProject(projectName);

            cy.get('.Toastify__toast').within(() => {
                cy.get('button, [aria-label="close"]').click();
            });

            cy.get('.Toastify__toast').should('not.exist');
        });
    });
});
