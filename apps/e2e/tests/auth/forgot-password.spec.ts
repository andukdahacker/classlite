import { test, expect } from "../../fixtures/auth.fixture";

test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("displays forgot password form correctly", async ({ page }) => {
    // Check form elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for back to sign in link (exact href is /sign-in)
    await expect(page.locator('a[href="/sign-in"]')).toBeVisible();
  });

  test("email field validation - empty", async ({ page }) => {
    // Try to submit without entering email
    await page.click('button[type="submit"]');

    // Should stay on page and show validation message
    expect(page.url()).toContain("forgot-password");
  });

  test("email field validation - invalid format", async ({ page }) => {
    await page.fill('input[type="email"]', "notanemail");
    await page.click('button[type="submit"]');

    // Should show validation error
    expect(page.url()).toContain("forgot-password");
  });

  test("shows success message for any email (no email enumeration)", async ({ page }) => {
    // Enter any email address
    await page.fill('input[type="email"]', "anyemail@example.com");
    await page.click('button[type="submit"]');

    // Should show success message regardless of whether email exists
    // This prevents email enumeration attacks
    // The UI shows "Check your email for a reset link" in the CardDescription
    await expect(
      page.getByText("Check your email for a reset link")
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows success message for valid email", async ({ page }) => {
    await page.fill('input[type="email"]', "test@example.com");
    await page.click('button[type="submit"]');

    // Should show generic success message (same as invalid email to prevent enumeration)
    // The UI shows "Check your email for a reset link" in the CardDescription
    await expect(
      page.getByText("Check your email for a reset link")
    ).toBeVisible({ timeout: 10000 });
  });

  test("back to login link works", async ({ page }) => {
    await page.click('a[href="/sign-in"]');

    await page.waitForURL(/.*sign-in/);
    expect(page.url()).toContain("sign-in");
    expect(page.url()).not.toContain("forgot-password");
  });
});
