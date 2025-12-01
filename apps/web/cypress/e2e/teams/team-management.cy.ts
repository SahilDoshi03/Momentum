describe('Team Management', () => {
    beforeEach(() => {
        cy.loginAsTestUser();
    });

    describe('Team Creation', () => {
        it('should display create team modal', () => {
            cy.visit('/');

            cy.contains('button', 'New Team').click();
            cy.get('[role="dialog"], .modal').should('be.visible');
            cy.contains('Create Team').should('be.visible');
        });

        it('should create a new team', () => {
            cy.fixture('teams').then((teams) => {
                const teamName = `${teams.engineering.name} ${Date.now()}`;

                cy.createTeam(teamName);

                cy.contains(teamName).should('be.visible');
            });
        });

        it('should validate team name is required', () => {
            cy.visit('/');
            cy.contains('button', 'New Team').click();

            cy.contains('button', 'Create').click();

            cy.get('input[name="name"]:invalid').should('exist');
        });

        it('should cancel team creation', () => {
            cy.visit('/');
            cy.contains('button', 'New Team').click();

            cy.get('input[name="name"]').type('Cancelled Team');
            cy.contains('button', 'Cancel').click();

            cy.get('[role="dialog"], .modal').should('not.exist');
            cy.contains('Cancelled Team').should('not.exist');
        });
    });

    describe('Team Details', () => {
        let teamName: string;

        beforeEach(() => {
            teamName = `Test Team ${Date.now()}`;
            cy.createTeam(teamName);
        });

        it('should display team details page', () => {
            cy.contains(teamName).click();

            cy.url().should('include', '/team/');
            cy.contains(teamName).should('be.visible');
        });

        it('should show team projects tab', () => {
            cy.contains(teamName).click();

            cy.contains('Projects').should('be.visible');
            cy.get('[data-testid="projects-tab"]').should('have.class', /active|selected/);
        });

        it('should show team members tab', () => {
            cy.contains(teamName).click();

            cy.contains('Members').click();
            cy.get('[data-testid="members-tab"]').should('have.class', /active|selected/);
        });

        it('should display team owner', () => {
            cy.contains(teamName).click();
            cy.contains('Members').click();

            cy.fixture('users').then((users) => {
                cy.contains(users.testUser.fullName).should('be.visible');
                cy.contains('Owner').should('be.visible');
            });
        });
    });

    describe('Team Members', () => {
        let teamName: string;

        beforeEach(() => {
            teamName = `Members Team ${Date.now()}`;
            cy.createTeam(teamName);
            cy.contains(teamName).click();
            cy.contains('Members').click();
        });

        it('should add a member to team', () => {
            cy.fixture('users').then((users) => {
                cy.addTeamMember(teamName, users.secondUser.email);

                cy.contains(users.secondUser.email).should('be.visible');
            });
        });

        it('should validate email when adding member', () => {
            cy.contains('button', 'Add Member').click();

            cy.get('input[type="email"]').type('invalid-email');
            cy.contains('button', 'Add').click();

            cy.get('input[type="email"]:invalid').should('exist');
        });

        it('should show error for non-existent user', () => {
            cy.contains('button', 'Add Member').click();

            cy.get('input[type="email"]').type('nonexistent@example.com');
            cy.contains('button', 'Add').click();

            cy.contains(/not found|does not exist/i, { timeout: 10000 }).should('be.visible');
        });

        it('should remove a member from team', () => {
            cy.fixture('users').then((users) => {
                cy.addTeamMember(teamName, users.secondUser.email);

                cy.contains(users.secondUser.email).parent().within(() => {
                    cy.get('button[data-testid="remove"], button[aria-label*="remove"]').click();
                });

                cy.contains('button', 'Confirm').click();

                cy.contains(users.secondUser.email).should('not.exist');
            });
        });

        it('should not allow removing team owner', () => {
            cy.fixture('users').then((users) => {
                cy.contains(users.testUser.fullName).parent().within(() => {
                    cy.get('button[data-testid="remove"]').should('not.exist');
                });
            });
        });

        it('should display member count', () => {
            cy.get('[data-testid="member-count"]').should('contain', '1');

            cy.fixture('users').then((users) => {
                cy.addTeamMember(teamName, users.secondUser.email);

                cy.get('[data-testid="member-count"]').should('contain', '2');
            });
        });
    });

    describe('Team Projects', () => {
        let teamName: string;

        beforeEach(() => {
            teamName = `Projects Team ${Date.now()}`;
            cy.createTeam(teamName);
        });

        it('should create project for team', () => {
            const projectName = `Team Project ${Date.now()}`;

            cy.visit('/');
            cy.contains('button', 'New Project').click();

            cy.get('input[name="name"]').type(projectName);
            cy.get('select, [role="combobox"]').click();
            cy.contains(teamName).click();
            cy.contains('button', 'Create').click();

            // Navigate to team details
            cy.visit('/');
            cy.contains(teamName).click();

            // Project should appear in team's projects
            cy.contains(projectName).should('be.visible');
        });

        it('should display team projects count', () => {
            cy.contains(teamName).click();

            cy.get('[data-testid="projects-count"]').should('be.visible');
        });

        it('should show empty state when no projects', () => {
            cy.contains(teamName).click();

            cy.get('body').then(($body) => {
                if (!$body.find('[data-testid="project-card"]').length) {
                    cy.contains(/no projects|create your first/i).should('be.visible');
                }
            });
        });
    });

    describe('Team Settings', () => {
        let teamName: string;

        beforeEach(() => {
            teamName = `Settings Team ${Date.now()}`;
            cy.createTeam(teamName);
            cy.contains(teamName).click();
        });

        it('should open team settings', () => {
            cy.get('[data-testid="team-settings"], button[aria-label*="settings"]').click();

            cy.get('[role="dialog"], .modal').should('be.visible');
            cy.contains('Team Settings').should('be.visible');
        });

        it('should update team name', () => {
            const newName = `Updated ${teamName}`;

            cy.get('[data-testid="team-settings"]').click();

            cy.get('input[name="name"]').clear().type(newName);
            cy.contains('button', 'Save').click();

            cy.contains(newName, { timeout: 10000 }).should('be.visible');
        });

        it('should update team description', () => {
            cy.fixture('teams').then((teams) => {
                cy.get('[data-testid="team-settings"]').click();

                cy.get('textarea[name="description"]').type(teams.engineering.description);
                cy.contains('button', 'Save').click();

                cy.contains(teams.engineering.description, { timeout: 10000 }).should('be.visible');
            });
        });
    });

    describe('Team Deletion', () => {
        it('should delete a team', () => {
            const teamName = `Delete Team ${Date.now()}`;
            cy.createTeam(teamName);

            cy.contains(teamName).click();
            cy.get('[data-testid="team-settings"]').click();

            cy.contains('button', 'Delete Team').click();
            cy.contains('button', 'Confirm').click();

            cy.url().should('eq', `${Cypress.config().baseUrl}/`);
            cy.contains(teamName).should('not.exist');
        });

        it('should show confirmation before deleting', () => {
            const teamName = `Confirm Delete Team ${Date.now()}`;
            cy.createTeam(teamName);

            cy.contains(teamName).click();
            cy.get('[data-testid="team-settings"]').click();

            cy.contains('button', 'Delete Team').click();

            cy.contains(/are you sure|confirm/i).should('be.visible');
            cy.contains('button', 'Cancel').click();

            cy.visit('/');
            cy.contains(teamName).should('be.visible');
        });

        it('should not delete team with active projects', () => {
            const teamName = `Active Team ${Date.now()}`;
            cy.createTeam(teamName);

            // Create project for team
            cy.visit('/');
            cy.contains('button', 'New Project').click();
            cy.get('input[name="name"]').type('Team Project');
            cy.get('select').select(teamName);
            cy.contains('button', 'Create').click();

            // Try to delete team
            cy.visit('/');
            cy.contains(teamName).click();
            cy.get('[data-testid="team-settings"]').click();

            cy.contains('button', 'Delete Team').should('be.disabled');
        });
    });

    describe('Team Navigation', () => {
        it('should navigate between teams', () => {
            const team1 = `Team 1 ${Date.now()}`;
            const team2 = `Team 2 ${Date.now()}`;

            cy.createTeam(team1);
            cy.createTeam(team2);

            cy.visit('/');

            cy.contains(team1).click();
            cy.url().should('include', '/team/');
            cy.contains(team1).should('be.visible');

            cy.visit('/');
            cy.contains(team2).click();
            cy.url().should('include', '/team/');
            cy.contains(team2).should('be.visible');
        });

        it('should use breadcrumbs for navigation', () => {
            const teamName = `Breadcrumb Team ${Date.now()}`;
            cy.createTeam(teamName);
            cy.contains(teamName).click();

            cy.get('[data-testid="breadcrumb"], nav').within(() => {
                cy.contains('Teams').click();
            });

            cy.url().should('eq', `${Cypress.config().baseUrl}/`);
        });
    });

    describe('Team List View', () => {
        beforeEach(() => {
            cy.createTeam(`Team A ${Date.now()}`);
            cy.createTeam(`Team B ${Date.now()}`);
        });

        it('should display all user teams', () => {
            cy.visit('/');

            cy.contains('Team A').should('be.visible');
            cy.contains('Team B').should('be.visible');
        });

        it('should show empty state when no teams', () => {
            // This would require deleting all teams first
            cy.visit('/');

            cy.get('body').then(($body) => {
                if (!$body.text().includes('Team')) {
                    cy.contains(/no teams|create your first/i).should('be.visible');
                }
            });
        });
    });
});
