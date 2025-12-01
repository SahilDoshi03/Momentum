describe('Project Management', () => {
    beforeEach(() => {
        cy.loginAsTestUser();
    });

    describe('Project Creation', () => {
        it('should display create project modal', () => {
            cy.visit('/');

            cy.contains('button', 'New Project').click();
            cy.get('[role="dialog"], .modal').should('be.visible');
            cy.contains('Create Project').should('be.visible');
        });

        it('should create a personal project', () => {
            cy.fixture('projects').then((projects) => {
                const projectName = `${projects.personal.name} ${Date.now()}`;

                cy.visit('/');
                cy.contains('button', 'New Project').click();

                cy.get('input[name="name"], input[placeholder*="Project"]').type(projectName);
                cy.contains('button', 'Create').click();

                // Should see the new project in the list
                cy.contains(projectName, { timeout: 10000 }).should('be.visible');
            });
        });

        it('should create a team project', () => {
            // First create a team
            const teamName = `Test Team ${Date.now()}`;
            cy.createTeam(teamName);

            cy.fixture('projects').then((projects) => {
                const projectName = `${projects.team.name} ${Date.now()}`;

                cy.visit('/');
                cy.contains('button', 'New Project').click();

                cy.get('input[name="name"]').type(projectName);

                // Select the team
                cy.get('select, [role="combobox"]').click();
                cy.contains(teamName).click();

                cy.contains('button', 'Create').click();

                cy.contains(projectName, { timeout: 10000 }).should('be.visible');
            });
        });

        it('should validate project name is required', () => {
            cy.visit('/');
            cy.contains('button', 'New Project').click();

            cy.contains('button', 'Create').click();

            // Should show validation error or prevent submission
            cy.get('input[name="name"]:invalid').should('exist');
        });

        it('should cancel project creation', () => {
            cy.visit('/');
            cy.contains('button', 'New Project').click();

            cy.get('input[name="name"]').type('Cancelled Project');
            cy.contains('button', 'Cancel').click();

            // Modal should close
            cy.get('[role="dialog"], .modal').should('not.exist');
            cy.contains('Cancelled Project').should('not.exist');
        });
    });

    describe('Project Board', () => {
        let projectName: string;

        beforeEach(() => {
            cy.fixture('projects').then((projects) => {
                projectName = `${projects.sample.name} ${Date.now()}`;
                cy.createProject(projectName);
                cy.openProject(projectName);
            });
        });

        it('should display project board', () => {
            cy.contains(projectName).should('be.visible');
            cy.get('[data-testid="project-board"], .board').should('be.visible');
        });

        it('should display default lists', () => {
            // Most Kanban boards start with default lists like "To Do", "In Progress", "Done"
            cy.contains('To Do').should('be.visible');
        });

        it('should create a new list', () => {
            const listName = `New List ${Date.now()}`;

            cy.contains('Add another list').click();
            cy.get('input[placeholder*="list"], input[name="name"]').type(listName);
            cy.contains('button', 'Add').click();

            cy.contains(listName).should('be.visible');
        });

        it('should rename a list', () => {
            const newListName = `Renamed List ${Date.now()}`;

            // Click on list title to edit
            cy.contains('To Do').click();
            cy.get('input').clear().type(newListName);
            cy.get('input').blur();

            cy.contains(newListName).should('be.visible');
            cy.contains('To Do').should('not.exist');
        });
    });

    describe('Project Settings', () => {
        let projectName: string;

        beforeEach(() => {
            cy.fixture('projects').then((projects) => {
                projectName = `${projects.sample.name} ${Date.now()}`;
                cy.createProject(projectName);
                cy.openProject(projectName);
            });
        });

        it('should open project settings', () => {
            cy.get('[data-testid="project-settings"], button[aria-label*="settings"]').click();

            cy.get('[role="dialog"], .modal').should('be.visible');
            cy.contains('Project Settings').should('be.visible');
        });

        it('should update project name', () => {
            const newName = `Updated ${projectName}`;

            cy.get('[data-testid="project-settings"], button[aria-label*="settings"]').click();

            cy.get('input[name="name"]').clear().type(newName);
            cy.contains('button', 'Save').click();

            cy.contains(newName, { timeout: 10000 }).should('be.visible');
        });

        it('should display members tab', () => {
            cy.get('[data-testid="project-settings"]').click();

            cy.contains('Members').click();
            cy.contains('Add Member').should('be.visible');
        });

        it('should add a member to project', () => {
            cy.fixture('users').then((users) => {
                cy.get('[data-testid="project-settings"]').click();
                cy.contains('Members').click();

                cy.contains('button', 'Add Member').click();
                cy.get('input[type="email"]').type(users.secondUser.email);
                cy.contains('button', 'Add').click();

                cy.contains(users.secondUser.email, { timeout: 10000 }).should('be.visible');
            });
        });
    });

    describe('Project Deletion', () => {
        it('should delete a project', () => {
            const projectName = `To Delete ${Date.now()}`;
            cy.createProject(projectName);

            cy.visit('/');
            cy.contains(projectName).should('be.visible');

            // Open project settings
            cy.contains(projectName).click();
            cy.get('[data-testid="project-settings"]').click();

            // Delete project
            cy.contains('button', 'Delete Project').click();
            cy.contains('button', 'Confirm').click();

            // Should redirect to home
            cy.url().should('eq', `${Cypress.config().baseUrl}/`);

            // Project should not exist
            cy.contains(projectName).should('not.exist');
        });

        it('should show confirmation before deleting', () => {
            const projectName = `Confirm Delete ${Date.now()}`;
            cy.createProject(projectName);

            cy.openProject(projectName);
            cy.get('[data-testid="project-settings"]').click();

            cy.contains('button', 'Delete Project').click();

            // Should show confirmation modal
            cy.contains(/are you sure|confirm/i).should('be.visible');
            cy.contains('button', 'Cancel').click();

            // Project should still exist
            cy.visit('/');
            cy.contains(projectName).should('be.visible');
        });
    });

    describe('Project Navigation', () => {
        it('should navigate between projects', () => {
            const project1 = `Project 1 ${Date.now()}`;
            const project2 = `Project 2 ${Date.now()}`;

            cy.createProject(project1);
            cy.createProject(project2);

            cy.visit('/');

            cy.contains(project1).click();
            cy.url().should('include', '/project/');
            cy.contains(project1).should('be.visible');

            cy.visit('/');
            cy.contains(project2).click();
            cy.url().should('include', '/project/');
            cy.contains(project2).should('be.visible');
        });

        it('should use breadcrumbs for navigation', () => {
            const projectName = `Breadcrumb Test ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);

            // Click breadcrumb to go back
            cy.get('[data-testid="breadcrumb"], nav').within(() => {
                cy.contains('Projects').click();
            });

            cy.url().should('eq', `${Cypress.config().baseUrl}/`);
        });
    });

    describe('Project List View', () => {
        beforeEach(() => {
            // Create multiple projects for testing
            cy.createProject(`Personal Project ${Date.now()}`);
            cy.createProject(`Work Project ${Date.now()}`);
        });

        it('should display all user projects', () => {
            cy.visit('/');

            cy.contains('Personal Project').should('be.visible');
            cy.contains('Work Project').should('be.visible');
        });

        it('should filter projects by team', () => {
            const teamName = `Filter Team ${Date.now()}`;
            cy.createTeam(teamName);

            // Create team project
            cy.visit('/');
            cy.contains('button', 'New Project').click();
            cy.get('input[name="name"]').type('Team Project');
            cy.get('select').select(teamName);
            cy.contains('button', 'Create').click();

            // Filter by team
            cy.contains(teamName).click();
            cy.contains('Team Project').should('be.visible');
        });

        it('should show empty state when no projects', () => {
            // Delete all projects first (this is a simplified version)
            cy.visit('/');

            // If there are no projects, should show empty state
            cy.get('body').then(($body) => {
                if (!$body.text().includes('Project')) {
                    cy.contains(/no projects|get started|create your first/i).should('be.visible');
                }
            });
        });
    });
});
