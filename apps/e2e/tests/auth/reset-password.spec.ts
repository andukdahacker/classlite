import { test, expect } from "../../fixtures/auth.fixture";

test.describe("Reset Password Page", () => {
  // Note: These tests require a valid reset token
  // In a real scenario, you'd either:
  // 1. Mock the token validation on the backend
  // 2. Use a test endpoint to generate valid tokens
  // 3. Test with a known valid token from test seed data

  test("shows invalid token error for missing token", async ({ page }) => {
    await page.goto("/reset-password");

    // Should show error about missing/invalid token
    await expect(
      page.locator('text="invalid"').or(
        page.locator('text="expired"')
      ).or(
        page.locator('text="token"')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows invalid token error for malformed token", async ({ page }) => {
    await page.goto("/reset-password?token=invalid-token-123");

    // Should show error about invalid token
    await expect(
      page.locator('text="invalid"').or(
        page.locator('text="expired"')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test.describe("With Valid Token (mocked)", () => {
    // These tests would need a valid token - skip in automated runs
    // unless test infrastructure provides token generation

    test.skip("displays reset password form with valid token", async ({ page }) => {
      // In a real test, you'd navigate with a valid token
      await page.goto("/reset-password?token=VALID_TEST_TOKEN");

      await expect(page.locator('input[type="password"]').first()).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test.skip("password requirements are enforced", async ({ page }) => {
      await page.goto("/reset-password?token=VALID_TEST_TOKEN");

      // Try weak password
      await page.fill('input[name="password"]', "weak");
      await page.fill('input[name="confirmPassword"]', "weak");
      await page.click('button[type="submit"]');

      // Should show password requirements error
      await expect(
        page.locator('text="8 characters"').or(
          page.locator('text="password requirements"')
        )
      ).toBeVisible();
    });

    test.skip("passwords must match", async ({ page }) => {
      await page.goto("/reset-password?token=VALID_TEST_TOKEN");

      await page.fill('input[name="password"]', "ValidPassword123!");
      await page.fill('input[name="confirmPassword"]', "DifferentPassword123!");
      await page.click('button[type="submit"]');

      // Should show password mismatch error
      await expect(
        page.locator('text="match"').or(
          page.locator('text="same"')
        )
      ).toBeVisible();
    });

    test.skip("successful reset redirects to login with success message", async ({ page }) => {
      await page.goto("/reset-password?token=VALID_TEST_TOKEN");

      await page.fill('input[name="password"]', "NewValidPassword123!");
      await page.fill('input[name="confirmPassword"]', "NewValidPassword123!");
      await page.click('button[type="submit"]');

      // Should redirect to login page
      await page.waitForURL(/.*login/);

      // Should show success message
      await expect(
        page.locator('text="success"').or(
          page.locator('[data-sonner-toast]')
        )
      ).toBeVisible();
    });
  });
});
