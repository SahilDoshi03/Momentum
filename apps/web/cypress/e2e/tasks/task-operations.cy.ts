describe('Task Operations', () => {
    let projectName: string;

    beforeEach(() => {
        cy.loginAsTestUser();

        cy.fixture('projects').then((projects) => {
            projectName = `${projects.sample.name} ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);
        });
    });

    describe('Task Creation', () => {
        it('should create a new task', () => {
            cy.fixture('tasks').then((tasks) => {
                const taskName = `${tasks.basic.name} ${Date.now()}`;

                cy.createTask('To Do', taskName);
                cy.contains(taskName).should('be.visible');
            });
        });

        it('should create multiple tasks', () => {
            const task1 = `Task 1 ${Date.now()}`;
            const task2 = `Task 2 ${Date.now()}`;

            cy.createTask('To Do', task1);
            cy.createTask('To Do', task2);

            cy.contains(task1).should('be.visible');
            cy.contains(task2).should('be.visible');
        });

        it('should cancel task creation', () => {
            cy.contains('To Do').parent().within(() => {
                cy.contains('Add').click();
                cy.get('textarea, input').type('Cancelled Task');
                cy.contains('button', 'Cancel').click();
            });

            cy.contains('Cancelled Task').should('not.exist');
        });

        it('should not create task with empty name', () => {
            cy.contains('To Do').parent().within(() => {
                cy.contains('Add').click();
                cy.contains('button', 'Add').click();
            });

            // Should still show the input or prevent submission
            cy.get('textarea, input').should('be.visible');
        });
    });

    describe('Task Detail Modal', () => {
        let taskName: string;

        beforeEach(() => {
            cy.fixture('tasks').then((tasks) => {
                taskName = `${tasks.basic.name} ${Date.now()}`;
                cy.createTask('To Do', taskName);
            });
        });

        it('should open task detail modal', () => {
            cy.openTaskDetail(taskName);

            cy.get('[role="dialog"], .modal').should('be.visible');
            cy.contains(taskName).should('be.visible');
        });

        it('should close task detail modal', () => {
            cy.openTaskDetail(taskName);

            cy.get('[data-testid="close-modal"], button[aria-label="Close"]').click();
            cy.get('[role="dialog"], .modal').should('not.exist');
        });

        it('should close modal on escape key', () => {
            cy.openTaskDetail(taskName);

            cy.get('body').type('{esc}');
            cy.get('[role="dialog"], .modal').should('not.exist');
        });

        it('should close modal on backdrop click', () => {
            cy.openTaskDetail(taskName);

            cy.get('[role="dialog"], .modal').parent().click('topLeft');
            cy.get('[role="dialog"], .modal').should('not.exist');
        });
    });

    describe('Task Editing', () => {
        let taskName: string;

        beforeEach(() => {
            taskName = `Edit Task ${Date.now()}`;
            cy.createTask('To Do', taskName);
        });

        it('should edit task name', () => {
            const newName = `Updated ${taskName}`;

            cy.openTaskDetail(taskName);

            cy.get('input[value*="Edit"], h2, h3').click();
            cy.get('input, textarea').clear().type(newName);
            cy.get('input, textarea').blur();

            cy.get('[data-testid="close-modal"]').click();
            cy.contains(newName).should('be.visible');
        });

        it('should add task description', () => {
            cy.fixture('tasks').then((tasks) => {
                cy.openTaskDetail(taskName);

                cy.contains('Description').parent().within(() => {
                    cy.get('textarea').type(tasks.basic.description);
                });

                cy.get('[data-testid="close-modal"]').click();
                cy.openTaskDetail(taskName);

                cy.contains(tasks.basic.description).should('be.visible');
            });
        });

        it('should set due date', () => {
            cy.openTaskDetail(taskName);

            cy.contains('Due Date').parent().within(() => {
                cy.get('input[type="date"]').type('2024-12-31');
            });

            cy.get('[data-testid="close-modal"]').click();
            cy.openTaskDetail(taskName);

            cy.contains('Dec 31').should('be.visible');
        });

        it('should add labels', () => {
            cy.openTaskDetail(taskName);

            cy.contains('Labels').parent().within(() => {
                cy.contains('button', 'Add').click();
            });

            cy.get('input[placeholder*="label"]').type('Bug{enter}');

            cy.contains('Bug').should('be.visible');
        });

        it('should assign users', () => {
            cy.fixture('users').then((users) => {
                cy.openTaskDetail(taskName);

                cy.contains('Assigned').parent().within(() => {
                    cy.contains('button', 'Add').click();
                });

                cy.contains(users.testUser.fullName).click();

                cy.contains(users.testUser.initials).should('be.visible');
            });
        });
    });

    describe('Task Completion', () => {
        let taskName: string;

        beforeEach(() => {
            taskName = `Complete Task ${Date.now()}`;
            cy.createTask('To Do', taskName);
        });

        it('should mark task as complete', () => {
            cy.markTaskComplete(taskName);

            // Task should show as completed (strikethrough or checkmark)
            cy.contains(taskName).parent().within(() => {
                cy.get('[data-testid="completed"], .completed, input[type="checkbox"]:checked').should('exist');
            });
        });

        it('should mark task as incomplete', () => {
            cy.markTaskComplete(taskName);
            cy.markTaskComplete(taskName); // Toggle back

            cy.contains(taskName).parent().within(() => {
                cy.get('input[type="checkbox"]:not(:checked)').should('exist');
            });
        });

        it('should show completion status in detail modal', () => {
            cy.markTaskComplete(taskName);
            cy.openTaskDetail(taskName);

            cy.get('input[type="checkbox"]:checked, [data-testid="complete-checkbox"]:checked').should('exist');
        });
    });

    describe('Task Deletion', () => {
        it('should delete a task', () => {
            const taskName = `Delete Task ${Date.now()}`;
            cy.createTask('To Do', taskName);

            cy.deleteTask(taskName);

            cy.contains(taskName).should('not.exist');
        });

        it('should show confirmation before deleting', () => {
            const taskName = `Confirm Delete ${Date.now()}`;
            cy.createTask('To Do', taskName);

            cy.openTaskDetail(taskName);
            cy.contains('button', 'Delete').click();

            cy.contains(/are you sure|confirm/i).should('be.visible');
            cy.contains('button', 'Cancel').click();

            cy.contains(taskName).should('be.visible');
        });

        it('should delete task from card', () => {
            const taskName = `Quick Delete ${Date.now()}`;
            cy.createTask('To Do', taskName);

            cy.contains(taskName).parent().within(() => {
                cy.get('[data-testid="delete-task"], button[aria-label*="delete"]').click();
            });

            cy.contains('button', 'Confirm').click();
            cy.contains(taskName).should('not.exist');
        });
    });

    describe('Task Labels', () => {
        let taskName: string;

        beforeEach(() => {
            taskName = `Label Task ${Date.now()}`;
            cy.createTask('To Do', taskName);
        });

        it('should create and add a label', () => {
            cy.openTaskDetail(taskName);

            cy.contains('Labels').parent().within(() => {
                cy.contains('button', 'Add').click();
            });

            cy.get('input[placeholder*="label"]').type('Feature{enter}');
            cy.contains('Feature').should('be.visible');

            // Label should appear on the task card
            cy.get('[data-testid="close-modal"]').click();
            cy.contains(taskName).parent().within(() => {
                cy.contains('Feature').should('be.visible');
            });
        });

        it('should remove a label', () => {
            cy.openTaskDetail(taskName);

            // Add label
            cy.contains('Labels').parent().within(() => {
                cy.contains('button', 'Add').click();
            });
            cy.get('input[placeholder*="label"]').type('Bug{enter}');

            // Remove label
            cy.contains('Bug').parent().within(() => {
                cy.get('button, [data-testid="remove"]').click();
            });

            cy.contains('Bug').should('not.exist');
        });

        it('should display multiple labels', () => {
            cy.openTaskDetail(taskName);

            cy.contains('Labels').parent().within(() => {
                cy.contains('button', 'Add').click();
            });

            cy.get('input[placeholder*="label"]').type('Bug{enter}');
            cy.get('input[placeholder*="label"]').type('Urgent{enter}');

            cy.contains('Bug').should('be.visible');
            cy.contains('Urgent').should('be.visible');
        });
    });

    describe('Task Assignment', () => {
        let taskName: string;

        beforeEach(() => {
            taskName = `Assign Task ${Date.now()}`;
            cy.createTask('To Do', taskName);
        });

        it('should assign current user to task', () => {
            cy.fixture('users').then((users) => {
                cy.openTaskDetail(taskName);

                cy.contains('Assigned').parent().within(() => {
                    cy.contains('button', 'Add').click();
                });

                cy.contains(users.testUser.fullName).click();

                // Should show user avatar/initials
                cy.contains(users.testUser.initials).should('be.visible');
            });
        });

        it('should unassign user from task', () => {
            cy.fixture('users').then((users) => {
                cy.openTaskDetail(taskName);

                // Assign user
                cy.contains('Assigned').parent().within(() => {
                    cy.contains('button', 'Add').click();
                });
                cy.contains(users.testUser.fullName).click();

                // Unassign user
                cy.contains(users.testUser.initials).parent().within(() => {
                    cy.get('button, [data-testid="remove"]').click();
                });

                cy.contains(users.testUser.initials).should('not.exist');
            });
        });

        it('should display assigned users on task card', () => {
            cy.fixture('users').then((users) => {
                cy.openTaskDetail(taskName);

                cy.contains('Assigned').parent().within(() => {
                    cy.contains('button', 'Add').click();
                });
                cy.contains(users.testUser.fullName).click();

                cy.get('[data-testid="close-modal"]').click();

                cy.contains(taskName).parent().within(() => {
                    cy.contains(users.testUser.initials).should('be.visible');
                });
            });
        });
    });
});
