# Cypress E2E Tests - Setup Guide

## Prerequisites

Before running E2E tests, ensure:
1. ✅ Backend API is running at `http://localhost:5000`
2. ✅ Frontend dev server is running at `http://localhost:3000`
3. ✅ Database is running and accessible

## First Time Setup

### Step 1: Start Your Servers

```bash
# Terminal 1: Start backend
cd apps/api
npm run dev

# Terminal 2: Start frontend  
cd apps/web
npm run dev
```

### Step 2: Create Test Users

**Option A: Run Setup Test (Recommended)**
```bash
cd apps/web
npx cypress run --spec "cypress/e2e/setup.cy.ts"
```

This will create all test users:
- `test@momentum.com` / `Test123!@#`
- `user2@momentum.com` / `User123!@#`
- `member@momentum.com` / `Member123!@#`

**Option B: Manual Registration**
1. Visit `http://localhost:3000/register`
2. Register each user from `cypress/fixtures/users.json`

**Option C: Database Seed Script**
If you have a seed script, run it to populate test data.

## Running Tests

### Interactive Mode (Cypress UI)
```bash
# Using Turbo
turbo run test:e2e

# Or directly
cd apps/web
npm run test:e2e
```

### Headless Mode
```bash
# Using Turbo
turbo run test:e2e:run

# Or directly
cd apps/web
npm run test:e2e:run
```

### Run Specific Test File
```bash
cd apps/web
npx cypress run --spec "cypress/e2e/auth/authentication.cy.ts"
```

### Run in Specific Browser
```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

## Test Structure

```
cypress/
├── e2e/
│   ├── setup.cy.ts              # Run this first!
│   ├── auth/
│   │   └── authentication.cy.ts
│   ├── projects/
│   │   └── project-management.cy.ts
│   ├── tasks/
│   │   ├── task-operations.cy.ts
│   │   ├── task-lists.cy.ts
│   │   └── my-tasks.cy.ts
│   ├── teams/
│   │   └── team-management.cy.ts
│   ├── user/
│   │   └── profile.cy.ts
│   └── ui/
│       └── navigation.cy.ts
├── fixtures/
│   └── users.json               # Test user credentials
└── support/
    └── commands.ts              # Custom commands
```

## Troubleshooting

### Tests Fail with "Login Failed"
**Problem:** Test users don't exist in database

**Solution:** Run the setup test first:
```bash
npx cypress run --spec "cypress/e2e/setup.cy.ts"
```

### Tests Timeout
**Problem:** Backend or frontend not running

**Solution:** Ensure both servers are running:
```bash
# Check backend
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost:3000
```

### "User already exists" Error
**Problem:** Test users already registered

**Solution:** This is fine! The setup test will fail but other tests should work. Just skip the setup test.

### Database Has Stale Data
**Problem:** Previous test runs left data

**Solution:** Reset your test database or use a fresh database for E2E tests.

## Best Practices

### 1. Clean Database
For consistent results, use a separate test database and reset it between test runs.

### 2. Run Setup Once
Only run `setup.cy.ts` once per database. After that, test users will exist.

### 3. Test Isolation
Each test should be independent. Tests use `beforeEach` to clear localStorage/cookies.

### 4. Parallel Execution
Don't run tests in parallel on the same database - they may conflict.

### 5. CI/CD
In CI, always:
1. Start backend
2. Start frontend
3. Run setup test
4. Run all tests
5. Tear down

## Environment Variables

Create `.env.local` in `apps/web`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Custom Commands

Available custom commands (see `cypress/support/commands.ts`):

### Authentication
- `cy.login(email, password)` - Login with credentials
- `cy.loginAsTestUser()` - Login as default test user
- `cy.logout()` - Logout current user

### Projects
- `cy.createProject(name, teamId?)` - Create new project
- `cy.openProject(name)` - Navigate to project

### Tasks
- `cy.createTask(listName, taskName)` - Create task in list
- `cy.openTaskDetail(taskName)` - Open task modal

### Teams
- `cy.createTeam(name)` - Create new team

### UI
- `cy.waitForPageLoad()` - Wait for page to load
- `cy.openUserMenu()` - Open user dropdown
- `cy.toggleTheme()` - Switch light/dark theme

## Test Data

Test users are defined in `cypress/fixtures/users.json`:

```json
{
  "testUser": {
    "firstName": "Test",
    "lastName": "User",
    "email": "test@momentum.com",
    "password": "Test123!@#"
  }
}
```

## Videos and Screenshots

Test runs automatically capture:
- **Videos**: `cypress/videos/` (on all runs)
- **Screenshots**: `cypress/screenshots/` (on failures)

These are gitignored by default.

## Quick Start

```bash
# 1. Start servers (2 terminals)
cd apps/api && npm run dev
cd apps/web && npm run dev

# 2. Create test users (one time)
cd apps/web
npx cypress run --spec "cypress/e2e/setup.cy.ts"

# 3. Run tests
turbo run test:e2e
```

## Support

If tests fail:
1. Check backend/frontend are running
2. Check test users exist (run setup)
3. Check browser console for errors
4. Review Cypress video/screenshots
5. Run tests in interactive mode to debug
