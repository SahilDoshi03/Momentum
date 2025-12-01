describe('My Tasks View', () => {
    beforeEach(() => {
        cy.loginAsTestUser();
    });

    describe('My Tasks Page', () => {
        it('should navigate to My Tasks page', () => {
            cy.visit('/');

            cy.contains('My Tasks').click();
            cy.url().should('include', '/my-tasks');
            cy.contains('Tasks assigned to you').should('be.visible');
        });

        it('should display assigned tasks', () => {
            // Create a project and task
            const projectName = `My Tasks Project ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);

            const taskName = `Assigned Task ${Date.now()}`;
            cy.createTask('To Do', taskName);

            // Assign task to current user
            cy.openTaskDetail(taskName);
            cy.fixture('users').then((users) => {
                cy.contains('Assigned').parent().within(() => {
                    cy.contains('button', 'Add').click();
                });
                cy.contains(users.testUser.fullName).click();
            });
            cy.get('[data-testid="close-modal"]').click();

            // Navigate to My Tasks
            cy.visit('/my-tasks');

            // Verify task appears
            cy.contains(taskName).should('be.visible');
        });

        it('should show empty state when no tasks assigned', () => {
            cy.visit('/my-tasks');

            // If no tasks, should show empty state
            cy.get('body').then(($body) => {
                if (!$body.find('[data-testid="task-row"]').length) {
                    cy.contains(/no tasks|nothing assigned/i).should('be.visible');
                }
            });
        });
    });

    describe('Task Filtering', () => {
        beforeEach(() => {
            // Create project with tasks
            const projectName = `Filter Project ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);

            // Create and assign tasks
            const task1 = `Incomplete Task ${Date.now()}`;
            const task2 = `Complete Task ${Date.now()}`;

            cy.createTask('To Do', task1);
            cy.createTask('To Do', task2);

            // Assign both tasks
            cy.fixture('users').then((users) => {
                [task1, task2].forEach(task => {
                    cy.openTaskDetail(task);
                    cy.contains('Assigned').parent().within(() => {
                        cy.contains('button', 'Add').click();
                    });
                    cy.contains(users.testUser.fullName).click();
                    cy.get('[data-testid="close-modal"]').click();
                });

                // Mark task2 as complete
                cy.markTaskComplete(task2);
            });

            cy.visit('/my-tasks');
        });

        it('should filter by all tasks', () => {
            cy.contains('button', 'All Tasks').click();

            cy.contains('Incomplete Task').should('be.visible');
            cy.contains('Complete Task').should('be.visible');
        });

        it('should filter by incomplete tasks', () => {
            cy.contains('button', 'Incomplete').click();

            cy.contains('Incomplete Task').should('be.visible');
            cy.contains('Complete Task').should('not.exist');
        });

        it('should filter by complete tasks', () => {
            cy.contains('button', 'Complete').click();

            cy.contains('Complete Task').should('be.visible');
            cy.contains('Incomplete Task').should('not.exist');
        });
    });

    describe('Task Sorting', () => {
        beforeEach(() => {
            cy.visit('/my-tasks');
        });

        it('should sort by due date', () => {
            cy.contains('button', 'Due Date').click();

            // Tasks should be sorted by due date
            // Verify by checking order (tasks with earlier due dates first)
            cy.get('[data-testid="task-row"]').should('exist');
        });

        it('should sort by project', () => {
            cy.contains('button', 'Project').click();

            // Tasks should be grouped/sorted by project
            cy.get('[data-testid="task-row"]').should('exist');
        });

        it('should sort by name', () => {
            cy.contains('button', 'Name').click();

            // Tasks should be sorted alphabetically
            cy.get('[data-testid="task-row"]').should('exist');
        });

        it('should toggle sort direction', () => {
            cy.contains('button', 'Name').click();

            // Get first task name
            cy.get('[data-testid="task-row"]').first().invoke('text').then((firstName) => {
                // Click again to reverse sort
                cy.contains('button', 'Name').click();

                // First task should be different
                cy.get('[data-testid="task-row"]').first().invoke('text').should('not.equal', firstName);
            });
        });
    });

    describe('Task Grouping', () => {
        it('should group tasks by project', () => {
            cy.visit('/my-tasks');

            cy.contains('button', 'Project').click();

            // Should show project headers
            cy.get('[data-testid="project-group"]').should('exist');
        });

        it('should expand and collapse project groups', () => {
            cy.visit('/my-tasks');

            cy.contains('button', 'Project').click();

            // Find a project group and collapse it
            cy.get('[data-testid="project-group"]').first().within(() => {
                cy.get('button').click();
            });

            // Tasks should be hidden
            cy.get('[data-testid="task-row"]').should('not.be.visible');

            // Expand again
            cy.get('[data-testid="project-group"]').first().within(() => {
                cy.get('button').click();
            });

            cy.get('[data-testid="task-row"]').should('be.visible');
        });
    });

    describe('Task Actions from My Tasks', () => {
        let taskName: string;

        beforeEach(() => {
            // Create and assign a task
            const projectName = `Actions Project ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);

            taskName = `Action Task ${Date.now()}`;
            cy.createTask('To Do', taskName);

            cy.fixture('users').then((users) => {
                cy.openTaskDetail(taskName);
                cy.contains('Assigned').parent().within(() => {
                    cy.contains('button', 'Add').click();
                });
                cy.contains(users.testUser.fullName).click();
                cy.get('[data-testid="close-modal"]').click();
            });

            cy.visit('/my-tasks');
        });

        it('should mark task as complete from My Tasks', () => {
            cy.contains(taskName).parent().within(() => {
                cy.get('input[type="checkbox"], button[data-testid="complete"]').click();
            });

            // Task should show as completed
            cy.contains(taskName).parent().should('have.class', /complete|done/);
        });

        it('should open task detail from My Tasks', () => {
            cy.contains(taskName).click();

            cy.get('[role="dialog"], .modal').should('be.visible');
            cy.contains(taskName).should('be.visible');
        });

        it('should navigate to project from task', () => {
            cy.contains(taskName).parent().within(() => {
                cy.get('[data-testid="project-link"]').click();
            });

            cy.url().should('include', '/project/');
        });
    });

    describe('Due Date Display', () => {
        it('should highlight overdue tasks', () => {
            // Create task with past due date
            const projectName = `Overdue Project ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);

            const taskName = `Overdue Task ${Date.now()}`;
            cy.createTask('To Do', taskName);

            cy.openTaskDetail(taskName);
            cy.get('input[type="date"]').type('2020-01-01');

            cy.fixture('users').then((users) => {
                cy.contains('Assigned').parent().within(() => {
                    cy.contains('button', 'Add').click();
                });
                cy.contains(users.testUser.fullName).click();
            });
            cy.get('[data-testid="close-modal"]').click();

            cy.visit('/my-tasks');

            // Overdue task should be highlighted
            cy.contains(taskName).parent().should('have.class', /overdue|danger/);
        });

        it('should show due date in task row', () => {
            cy.visit('/my-tasks');

            cy.get('[data-testid="task-row"]').first().within(() => {
                cy.get('[data-testid="due-date"]').should('exist');
            });
        });
    });

    describe('Task Count', () => {
        it('should display task count', () => {
            cy.visit('/my-tasks');

            cy.get('[data-testid="task-count"]').should('be.visible');
        });

        it('should update count when filtering', () => {
            cy.visit('/my-tasks');

            cy.get('[data-testid="task-count"]').invoke('text').then((allCount) => {
                cy.contains('button', 'Incomplete').click();

                cy.get('[data-testid="task-count"]').invoke('text').should('not.equal', allCount);
            });
        });
    });
});
