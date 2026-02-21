import { test, expect, TEST_USERS, loginAs } from "../../fixtures/auth.fixture";
import { getUrlPath } from "../../utils/test-helpers";

/**
 * Reset login attempts for an email via the backend API.
 */
async function resetLoginAttempts(email: string): Promise<void> {
  const backendUrl = process.env.VITE_API_URL || "http://localhost:4000";
  try {
    await fetch(`${backendUrl}/api/v1/auth/login-attempt?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
  } catch {
    // Ignore errors - endpoint might not be available
  }
}

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    // Reset login attempts for the invalid-credentials test email to avoid
    // false lockout from accumulated attempts across E2E runs.
    await resetLoginAttempts("invalid@example.com");
    await page.goto("/sign-in");
  });

  test("displays login form correctly", async ({ page }) => {
    // Check form elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for forgot password link
    await expect(page.locator('a[href*="forgot-password"]')).toBeVisible();
  });

  test("valid login redirects to dashboard", async ({ page }) => {
    const user = TEST_USERS.OWNER;

    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    // Should redirect to /{centerId}/dashboard
    await page.waitForURL(/.*\/dashboard/);
    expect(getUrlPath(page)).toMatch(/.*\/dashboard/);
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('text="Email or password is incorrect"').or(
        page.locator('[data-sonner-toast]')
      )
    ).toBeVisible({ timeout: 10000 });

    // Should stay on sign-in page
    expect(page.url()).toContain("/sign-in");
  });

  test("email field validation", async ({ page }) => {
    // Submit without email
    await page.fill('input[type="password"]', "somepassword");
    await page.click('button[type="submit"]');

    // Should show validation error or prevent submission
    expect(page.url()).toContain("/sign-in");
  });

  test("password field validation", async ({ page }) => {
    // Submit without password
    await page.fill('input[type="email"]', "test@example.com");
    await page.click('button[type="submit"]');

    // Should show validation error or prevent submission
    expect(page.url()).toContain("/sign-in");
  });

  test("forgot password link navigates correctly", async ({ page }) => {
    await page.click('a[href*="forgot-password"]');

    await page.waitForURL(/.*forgot-password/);
    expect(page.url()).toContain("forgot-password");
  });

  test("remember me checkbox is functional", async ({ page }) => {
    const rememberMeCheckbox = page.locator(
      'input[type="checkbox"]'
    ).or(page.locator('[role="checkbox"]'));

    // Check if remember me exists (it's optional per implementation)
    const exists = await rememberMeCheckbox.count() > 0;
    if (exists) {
      await expect(rememberMeCheckbox.first()).toBeVisible();
      await rememberMeCheckbox.first().click();
    }
  });
});

test.describe("Account Lockout", () => {
  // Use a dedicated email NOT shared with TEST_USERS to prevent parallel tests'
  // loginAs fixture from resetting the lockout counter via resetLoginAttempts.
  // The email doesn't need to exist in Firebase — the backend records attempts
  // regardless, and the frontend calls recordLoginAttempt after Firebase auth fails.
  const lockoutEmail = "lockout-test@test.classlite.com";

  test.beforeEach(async () => {
    await resetLoginAttempts(lockoutEmail);
  });

  test.afterEach(async () => {
    await resetLoginAttempts(lockoutEmail);
  });

  test("account lockout after multiple failed attempts", async ({ page }) => {
    await page.goto("/sign-in");

    // Attempt login with wrong password 5 times (MAX_ATTEMPTS = 5)
    // Wait for each submit to fully complete (Firebase auth + backend record)
    // before starting the next attempt
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="email"]', lockoutEmail);
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Wait for either the lockout message or the regular error to appear
      // This ensures the backend has recorded the attempt before we continue
      await expect(
        page.locator('text=/Account locked due to too many failed attempts/').or(
          page.locator('text="Email or password is incorrect"')
        )
      ).toBeVisible({ timeout: 10000 });
    }

    // After 5 failed attempts, should show lockout message
    await expect(
      page.locator('text=/Account locked due to too many failed attempts/')
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Session Persistence", () => {
  test("user stays logged in after page refresh", async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Refresh the page
    await page.reload();

    // Should still be on dashboard (not redirected to sign-in)
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/sign-in");
  });
});
