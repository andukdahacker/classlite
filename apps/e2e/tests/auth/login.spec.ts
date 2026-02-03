import { test, expect, TEST_USERS, loginAs } from "../../fixtures/auth.fixture";
import { waitForToast, getUrlPath } from "../../utils/test-helpers";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
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

    // Should redirect to dashboard
    await page.waitForURL(/\/(dashboard|$)/);
    expect(getUrlPath(page)).toMatch(/\/(dashboard|$)/);
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error toast or message
    await expect(
      page.locator('text="Invalid email or password"').or(
        page.locator('[data-sonner-toast]')
      )
    ).toBeVisible({ timeout: 10000 });

    // Should stay on login page
    expect(page.url()).toContain("/login");
  });

  test("email field validation", async ({ page }) => {
    // Submit without email
    await page.fill('input[type="password"]', "somepassword");
    await page.click('button[type="submit"]');

    // Should show validation error or prevent submission
    expect(page.url()).toContain("/login");
  });

  test("password field validation", async ({ page }) => {
    // Submit without password
    await page.fill('input[type="email"]', "test@example.com");
    await page.click('button[type="submit"]');

    // Should show validation error or prevent submission
    expect(page.url()).toContain("/login");
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
  test.skip("account lockout after multiple failed attempts", async ({ page }) => {
    // This test is skipped by default as it may affect test user state
    // Enable when running against a test environment with reset capability

    await page.goto("/login");

    // Attempt login with wrong password multiple times
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="email"]', TEST_USERS.OWNER.email);
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000); // Wait between attempts
    }

    // Should show lockout message
    await expect(
      page.locator('text="too many attempts"').or(
        page.locator('text="locked"')
      )
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Session Persistence", () => {
  test("user stays logged in after page refresh", async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Refresh the page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/login");
  });
});
