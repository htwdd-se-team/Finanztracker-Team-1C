# Playwright Tests

This is a Playwright test suite for testing web applications via URL.

## Setup

Install dependencies:

```bash
pnpm install
```

Install Playwright browsers:

```bash
pnpm exec playwright install
```

## Running Tests

### Basic test run

Test a specific URL using environment variable:

```bash
TEST_URL=http://localhost:3000 pnpm test
```

Or test a production URL:

```bash
TEST_URL=https://example.com pnpm test
```

### Test modes

- **Headless mode (default)**: `pnpm test`
- **UI mode**: `pnpm test:ui` - Opens Playwright's interactive UI
- **Headed mode**: `pnpm test:headed` - Runs tests with visible browser
- **Debug mode**: `pnpm test:debug` - Opens Playwright's debugger

### View test report

After running tests, view the HTML report:

```bash
pnpm test:report
```

## Configuration

- Default test URL: `http://localhost:3000` (can be overridden with `TEST_URL` env var)
- Test configuration: `playwright.config.ts`
- Test files: `tests/*.spec.ts`

## Test Suites

### Example Tests (`example.spec.ts`)

Basic URL tests that verify a page loads correctly:
- Page loads successfully
- Page has a title
- HTTP status 200
- Page has accessible content

### Login Tests (`login.spec.ts`)

Comprehensive login flow tests:
- Form display validation
- Email validation (invalid email format)
- Password validation (minimum length)
- Invalid credentials error handling
- Successful login flow
- Form disabled state during login
- Navigation to register page

**Running login tests with credentials:**

```bash
TEST_URL=http://localhost:3000 TEST_EMAIL=user@example.com TEST_PASSWORD=password123 pnpm test login.spec.ts
```

Or set environment variables:

```bash
export TEST_URL=http://localhost:3000
export TEST_EMAIL=user@example.com
export TEST_PASSWORD=password123
pnpm test login.spec.ts
```

**Note:** Make sure you have a test user registered in your application before running the login tests.

### Transaction Tests (`transaction.spec.ts`)

End-to-end transaction creation tests:
- Opening transaction dialog
- Creating expense transactions
- Creating income transactions
- Amount validation
- Canceling transaction creation
- Creating transactions with categories

**Running transaction tests:**

```bash
TEST_URL=http://localhost:3000 TEST_EMAIL=user@example.com TEST_PASSWORD=password123 pnpm test transaction.spec.ts
```

**Note:** These tests require a logged-in user. They automatically log in before each test.

## Writing Tests

Add new test files in the `tests/` directory following the pattern `*.spec.ts`.

Example:

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  const testUrl = process.env.TEST_URL || 'http://localhost:3000';
  await page.goto(testUrl);
  // Your test assertions here
});
```
