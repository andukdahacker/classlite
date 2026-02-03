# E2E Tests

End-to-end tests for ClassLite using Playwright.

## Setup

```bash
# Install dependencies
pnpm install

# Install Playwright browsers (chromium only for faster setup)
pnpm --filter @workspace/e2e exec playwright install chromium
```

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see the browser)
pnpm test:e2e:headed

# Run specific test file
pnpm --filter @workspace/e2e test tests/auth/login.spec.ts

# Run tests matching a pattern
pnpm --filter @workspace/e2e test -g "login"
```

## Test Structure

```
apps/e2e/
├── fixtures/
│   └── auth.fixture.ts      # Role-based authentication fixtures
├── tests/
│   ├── auth/                # Authentication flow tests
│   │   ├── login.spec.ts
│   │   ├── forgot-password.spec.ts
│   │   ├── reset-password.spec.ts
│   │   └── protected-routes.spec.ts
│   ├── users/               # User management tests
│   │   ├── user-management.spec.ts
│   │   └── csv-import.spec.ts
│   └── navigation/          # Navigation tests
│       └── navigation.spec.ts
├── utils/
│   └── test-helpers.ts      # Common test utilities
└── playwright.config.ts     # Playwright configuration
```

## Auth Fixtures

The auth fixture provides pre-configured test users for different roles:

```typescript
import { test, expect, TEST_USERS, loginAs } from "../../fixtures/auth.fixture";

// Use predefined test users
test("owner can access settings", async ({ page }) => {
  await loginAs(page, TEST_USERS.OWNER);
  await page.goto("/settings");
  // ...
});

// Or use role-specific page fixtures
test("admin operations", async ({ adminPage }) => {
  await adminPage.goto("/users");
  // adminPage is already logged in as admin
});
```

Available roles: `OWNER`, `ADMIN`, `TEACHER`, `STUDENT`

## Test Patterns

### Page Object Pattern (Optional)

For complex pages, consider using page objects:

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

### Waiting for Elements

Use Playwright's built-in waiting:

```typescript
// Wait for element to be visible
await expect(page.locator('button')).toBeVisible();

// Wait for URL change
await page.waitForURL(/.*dashboard/);

// Wait for network idle
await page.waitForLoadState("networkidle");
```

### Testing RBAC

```typescript
test.describe("Role-Based Access", () => {
  test("teacher cannot access user management", async ({ page }) => {
    await loginAs(page, TEST_USERS.TEACHER);
    await page.goto("/users");

    // Either redirected or access denied
    const url = page.url();
    const hasError = await page.locator('text="access denied"').count() > 0;
    expect(url.includes("/users") && !hasError).toBeFalsy();
  });
});
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `E2E_BASE_URL` | Base URL for tests | `http://localhost:5173` |
| `E2E_OWNER_EMAIL` | Test owner email | `owner@test.classlite.com` |
| `E2E_OWNER_PASSWORD` | Test owner password | `TestPassword123!` |
| `CI` | Running in CI environment | - |

### Playwright Config

Key settings in `playwright.config.ts`:

- **Base URL**: `http://localhost:5173`
- **Browsers**: chromium, firefox, mobile-chrome
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: Only on failure
- **Traces**: On first retry

## CI Integration

E2E tests run in GitHub Actions after lint and typecheck pass:

- Uses PostgreSQL service container
- Installs Playwright chromium browser
- Uploads report artifact on failure

## Writing New Tests

1. Create spec file in appropriate `tests/` subdirectory
2. Import auth fixtures for role-based testing
3. Use descriptive `test.describe` blocks
4. Follow existing patterns for consistency

```typescript
import { test, expect, loginAs, TEST_USERS } from "../../fixtures/auth.fixture";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);
    await page.goto("/feature");
  });

  test("should do something", async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Debugging

```bash
# Run with debug mode
pnpm --filter @workspace/e2e test:debug

# Run single test in UI mode
pnpm test:e2e:ui -- tests/auth/login.spec.ts
```

## Skipped Tests

Some tests are skipped by default because they:
- Require specific test data setup
- Would create persistent state changes
- Need valid tokens that must be generated

Enable them for manual testing or when test infrastructure supports them.
