describe('Task Lists and Drag & Drop', () => {
    let projectName: string;

    beforeEach(() => {
        cy.loginAsTestUser();

        cy.fixture('projects').then((projects) => {
            projectName = `${projects.sample.name} ${Date.now()}`;
            cy.createProject(projectName);
            cy.openProject(projectName);
        });
    });

    describe('List Management', () => {
        it('should create a new list', () => {
            const listName = `New List ${Date.now()}`;

            cy.contains('Add another list').click();
            cy.get('input[placeholder*="list"], input[name="name"]').type(listName);
            cy.contains('button', 'Add').click();

            cy.contains(listName).should('be.visible');
        });

        it('should create multiple lists', () => {
            const list1 = `List 1 ${Date.now()}`;
            const list2 = `List 2 ${Date.now()}`;

            // Create first list
            cy.contains('Add another list').click();
            cy.get('input').type(list1);
            cy.contains('button', 'Add').click();

            // Create second list
            cy.contains('Add another list').click();
            cy.get('input').type(list2);
            cy.contains('button', 'Add').click();

            cy.contains(list1).should('be.visible');
            cy.contains(list2).should('be.visible');
        });

        it('should cancel list creation', () => {
            cy.contains('Add another list').click();
            cy.get('input').type('Cancelled List');
            cy.contains('button', 'Cancel').click();

            cy.contains('Cancelled List').should('not.exist');
            cy.contains('Add another list').should('be.visible');
        });

        it('should not create list with empty name', () => {
            cy.contains('Add another list').click();
            cy.contains('button', 'Add').click();

            // Should still show input or prevent submission
            cy.get('input').should('be.visible');
        });

        it('should rename a list', () => {
            const originalName = 'To Do';
            const newName = `Renamed List ${Date.now()}`;

            // Click on list title to edit
            cy.contains(originalName).click();
            cy.get('input').clear().type(newName).type('{enter}');

            cy.contains(newName).should('be.visible');
            cy.contains(originalName).should('not.exist');
        });

        it('should delete a list', () => {
            const listName = `Delete List ${Date.now()}`;

            // Create list
            cy.contains('Add another list').click();
            cy.get('input').type(listName);
            cy.contains('button', 'Add').click();

            // Delete list
            cy.contains(listName).parent().parent().within(() => {
                cy.get('[data-testid="list-menu"], button[aria-label*="menu"]').click();
            });
            cy.contains('Delete').click();
            cy.contains('button', 'Confirm').click();

            cy.contains(listName).should('not.exist');
        });
    });

    describe('Drag and Drop Tasks', () => {
        let task1: string;
        let task2: string;

        beforeEach(() => {
            task1 = `Task 1 ${Date.now()}`;
            task2 = `Task 2 ${Date.now()}`;

            // Create tasks in "To Do" list
            cy.createTask('To Do', task1);
            cy.createTask('To Do', task2);

            // Create "In Progress" list
            cy.contains('Add another list').click();
            cy.get('input').type('In Progress');
            cy.contains('button', 'Add').click();
        });

        it('should drag task to another list', () => {
            // Drag task1 from "To Do" to "In Progress"
            cy.contains(task1).drag('[data-testid="list-In Progress"], :contains("In Progress")');

            // Verify task is now in "In Progress" list
            cy.contains('In Progress').parent().parent().within(() => {
                cy.contains(task1).should('be.visible');
            });

            // Verify task is not in "To Do" list
            cy.contains('To Do').parent().parent().within(() => {
                cy.contains(task1).should('not.exist');
            });
        });

        it('should reorder tasks within the same list', () => {
            const task3 = `Task 3 ${Date.now()}`;
            cy.createTask('To Do', task3);

            // Get initial order
            cy.contains('To Do').parent().parent().within(() => {
                cy.get('[data-testid="task-card"], .task').then(($tasks) => {
                    const initialOrder = $tasks.toArray().map(el => el.textContent);

                    // Drag task3 to the top
                    cy.contains(task1).as('targetTask');
                    cy.contains(task3).drag('@targetTask');

                    // Verify order changed
                    cy.get('[data-testid="task-card"], .task').then(($newTasks) => {
                        const newOrder = $newTasks.toArray().map(el => el.textContent);
                        expect(newOrder).to.not.deep.equal(initialOrder);
                    });
                });
            });
        });

        it('should persist task position after drag', () => {
            cy.contains(task1).drag(':contains("In Progress")');

            // Reload page
            cy.reload();
            cy.waitForPageLoad();

            // Verify task is still in "In Progress"
            cy.contains('In Progress').parent().parent().within(() => {
                cy.contains(task1).should('be.visible');
            });
        });

        it('should drag multiple tasks', () => {
            cy.contains(task1).drag(':contains("In Progress")');
            cy.contains(task2).drag(':contains("In Progress")');

            cy.contains('In Progress').parent().parent().within(() => {
                cy.contains(task1).should('be.visible');
                cy.contains(task2).should('be.visible');
            });
        });
    });

    describe('Drag and Drop Lists', () => {
        beforeEach(() => {
            // Create additional lists
            cy.contains('Add another list').click();
            cy.get('input').type('In Progress');
            cy.contains('button', 'Add').click();

            cy.contains('Add another list').click();
            cy.get('input').type('Done');
            cy.contains('button', 'Add').click();
        });

        it('should reorder lists', () => {
            // Get initial list order
            cy.get('[data-testid="task-list"], .list').then(($lists) => {
                const initialOrder = $lists.toArray().map(el => el.textContent);

                // Drag "Done" list to the beginning
                cy.contains('To Do').parent().parent().as('targetList');
                cy.contains('Done').parent().parent().drag('@targetList');

                // Verify order changed
                cy.get('[data-testid="task-list"], .list').then(($newLists) => {
                    const newOrder = $newLists.toArray().map(el => el.textContent);
                    expect(newOrder).to.not.deep.equal(initialOrder);
                });
            });
        });

        it('should persist list order after drag', () => {
            // Drag "Done" to the beginning
            cy.contains('To Do').parent().parent().as('targetList');
            cy.contains('Done').parent().parent().drag('@targetList');

            // Reload page
            cy.reload();
            cy.waitForPageLoad();

            // Verify "Done" is first
            cy.get('[data-testid="task-list"], .list').first().should('contain', 'Done');
        });
    });

    describe('Drag and Drop Edge Cases', () => {
        it('should handle dragging to empty list', () => {
            const taskName = `Empty List Task ${Date.now()}`;
            cy.createTask('To Do', taskName);

            // Create empty list
            cy.contains('Add another list').click();
            cy.get('input').type('Empty List');
            cy.contains('button', 'Add').click();

            // Drag task to empty list
            cy.contains(taskName).drag(':contains("Empty List")');

            cy.contains('Empty List').parent().parent().within(() => {
                cy.contains(taskName).should('be.visible');
            });
        });

        it('should handle rapid drag operations', () => {
            const tasks = [
                `Rapid 1 ${Date.now()}`,
                `Rapid 2 ${Date.now()}`,
                `Rapid 3 ${Date.now()}`,
            ];

            tasks.forEach(task => cy.createTask('To Do', task));

            // Create target list
            cy.contains('Add another list').click();
            cy.get('input').type('Target');
            cy.contains('button', 'Add').click();

            // Drag all tasks rapidly
            tasks.forEach(task => {
                cy.contains(task).drag(':contains("Target")');
            });

            // Verify all tasks moved
            cy.contains('Target').parent().parent().within(() => {
                tasks.forEach(task => {
                    cy.contains(task).should('be.visible');
                });
            });
        });

        it('should cancel drag on escape', () => {
            const taskName = `Cancel Drag ${Date.now()}`;
            cy.createTask('To Do', taskName);

            // Start dragging
            cy.contains(taskName).trigger('mousedown');

            // Press escape
            cy.get('body').type('{esc}');

            // Task should still be in original list
            cy.contains('To Do').parent().parent().within(() => {
                cy.contains(taskName).should('be.visible');
            });
        });
    });

    describe('List Limits and Validation', () => {
        it('should handle many tasks in a list', () => {
            // Create 20 tasks
            for (let i = 1; i <= 20; i++) {
                cy.createTask('To Do', `Task ${i}`);
            }

            // Verify all tasks are visible (may need scrolling)
            cy.contains('To Do').parent().parent().within(() => {
                cy.contains('Task 1').should('be.visible');
                cy.contains('Task 20').should('be.visible');
            });
        });

        it('should handle many lists', () => {
            // Create 10 lists
            for (let i = 1; i <= 10; i++) {
                cy.contains('Add another list').click();
                cy.get('input').type(`List ${i}`);
                cy.contains('button', 'Add').click();
            }

            // Verify lists are created
            cy.contains('List 1').should('be.visible');
            cy.contains('List 10').should('be.visible');
        });

        it('should scroll horizontally with many lists', () => {
            // Create multiple lists to force horizontal scroll
            for (let i = 1; i <= 5; i++) {
                cy.contains('Add another list').click();
                cy.get('input').type(`Scroll List ${i}`);
                cy.contains('button', 'Add').click();
            }

            // Verify horizontal scrolling works
            cy.get('[data-testid="board-container"], .board').scrollTo('right');
            cy.contains('Scroll List 5').should('be.visible');
        });
    });
});
