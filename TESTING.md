# Testing Guide for Momentum

This guide covers how to run and write tests for the Momentum monorepo.

## Overview

The Momentum project uses Jest for testing both the frontend (Next.js/React) and backend (Express/TypeScript) applications.

## Running Tests

### Run All Tests
```bash
# From monorepo root
npm test

# Or using turbo
turbo run test
```

### Run Tests for Specific App
```bash
# Frontend tests
cd apps/web
npm test

# Backend tests
cd apps/api
npm test
```

### Watch Mode
```bash
# Frontend
cd apps/web
npm run test:watch

# Backend  
cd apps/api
npm test -- --watch
```

### Coverage Reports
```bash
# Frontend
cd apps/web
npm run test:coverage

# Backend
cd apps/api
npm test -- --coverage
```

## Frontend Testing (apps/web)

### Tech Stack
- **Jest**: Test runner
- **React Testing Library**: Component testing
- **ts-jest**: TypeScript support
- **jest-environment-jsdom**: DOM environment

### Test Structure
```
apps/web/src/
├── __tests__/
│   ├── setup.ts           # Global test setup
│   ├── components/        # Component tests
│   │   └── TaskCard.test.tsx
│   └── lib/              # Utility tests
│       └── api.test.ts
└── components/
    └── TaskCard.tsx       # Component being tested
```

### Writing Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const mockFn = jest.fn();
    render(<MyComponent onClick={mockFn} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### Mocked Modules

The following modules are automatically mocked in `setup.ts`:
- `next/router` - Next.js router
- `next/navigation` - App router navigation
- `@dnd-kit/*` - Drag and drop libraries

## Backend Testing (apps/api)

### Tech Stack
- **Jest**: Test runner
- **ts-jest**: TypeScript support
- **supertest**: HTTP testing
- **mongodb-memory-server**: In-memory MongoDB

### Test Structure
```
apps/api/src/
├── __tests__/
│   ├── setup.ts              # Global setup with MongoDB
│   ├── utils/
│   │   └── testHelpers.ts    # Test factories and helpers
│   ├── controllers/
│   │   └── taskController.test.ts
│   ├── models/
│   │   └── Task.test.ts
│   └── middleware/
│       └── auth.test.ts
└── controllers/
    └── taskController.ts     # Controller being tested
```

### Writing Controller Tests

```typescript
import {
  createTestUser,
  createTestProject,
  mockRequest,
  mockResponse,
} from '../utils/testHelpers';
import { myController } from '../../controllers/myController';

describe('MyController', () => {
  let testUser: any;
  
  beforeEach(async () => {
    testUser = await createTestUser();
  });

  it('returns data successfully', async () => {
    const req = mockRequest({ user: testUser });
    const res = mockResponse();
    const next = jest.fn();

    await myController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });
});
```

### Test Helpers

The `testHelpers.ts` file provides:
- `createTestUser()` - Create test user
- `createTestProject()` - Create test project
- `createTestTask()` - Create test task
- `mockRequest()` - Mock Express request
- `mockResponse()` - Mock Express response
- `mockNext()` - Mock Express next function

### MongoDB Memory Server

Tests use an in-memory MongoDB instance that:
- Starts before all tests
- Clears data after each test
- Stops after all tests complete

**Note**: First run may be slow as it downloads MongoDB binaries.

## Best Practices

### General
- Keep tests focused and isolated
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Clean up after tests

### Frontend
- Test user interactions, not implementation
- Use semantic queries (`getByRole`, `getByLabelText`)
- Avoid testing internal state
- Test accessibility

### Backend
- Test business logic, not framework code
- Use factories for test data
- Test error cases
- Verify database state changes

## Troubleshooting

### MongoDB Memory Server Issues
If tests timeout or fail to start:
```bash
# Clear MongoDB binaries cache
rm -rf ~/.cache/mongodb-binaries

# Or set download URL
export MONGOMS_DOWNLOAD_URL=https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-7.0.0.tgz
```

### TypeScript Errors
Ensure `@types/jest` is installed:
```bash
npm install --save-dev @types/jest
```

### React Version Conflicts
If you see peer dependency warnings with React 19:
```bash
npm install --legacy-peer-deps
```

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: npm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./apps/web/coverage/lcov.info,./apps/api/coverage/lcov.info
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
