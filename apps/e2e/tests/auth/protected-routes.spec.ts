import { test, expect, TEST_USERS, loginAs } from "../../fixtures/auth.fixture";

test.describe("Protected Routes", () => {
  test.describe("Unauthenticated Access", () => {
    test("redirects to login when accessing dashboard without auth", async ({ page }) => {
      await page.goto("/dashboard");

      // Should redirect to login
      await page.waitForURL(/.*login/);
      expect(page.url()).toContain("login");
    });

    test("redirects to login when accessing settings without auth", async ({ page }) => {
      await page.goto("/settings");

      await page.waitForURL(/.*login/);
      expect(page.url()).toContain("login");
    });

    test("redirects to login when accessing users page without auth", async ({ page }) => {
      await page.goto("/users");

      await page.waitForURL(/.*login/);
      expect(page.url()).toContain("login");
    });

    test("redirects to login when accessing courses page without auth", async ({ page }) => {
      await page.goto("/courses");

      await page.waitForURL(/.*login/);
      expect(page.url()).toContain("login");
    });

    test("redirects to login when accessing classes page without auth", async ({ page }) => {
      await page.goto("/classes");

      await page.waitForURL(/.*login/);
      expect(page.url()).toContain("login");
    });
  });

  test.describe("Role-Based Access - Owner", () => {
    test("owner can access dashboard", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/dashboard");

      // Should stay on dashboard
      await expect(page.url()).not.toContain("login");
    });

    test("owner can access user management", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/users");

      // Should be able to access users page
      await expect(page.url()).toContain("users");
    });

    test("owner can access settings", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/settings");

      // Should be able to access settings
      await expect(page.url()).toContain("settings");
    });
  });

  test.describe("Role-Based Access - Admin", () => {
    test("admin can access dashboard", async ({ page }) => {
      await loginAs(page, TEST_USERS.ADMIN);
      await page.goto("/dashboard");

      await expect(page.url()).not.toContain("login");
    });

    test("admin can access user management", async ({ page }) => {
      await loginAs(page, TEST_USERS.ADMIN);
      await page.goto("/users");

      await expect(page.url()).toContain("users");
    });
  });

  test.describe("Role-Based Access - Teacher", () => {
    test("teacher can access dashboard", async ({ page }) => {
      await loginAs(page, TEST_USERS.TEACHER);
      await page.goto("/dashboard");

      await expect(page.url()).not.toContain("login");
    });

    test("teacher cannot access user management", async ({ page }) => {
      await loginAs(page, TEST_USERS.TEACHER);
      await page.goto("/users");

      // Should be redirected or show access denied
      // Check for either redirect to dashboard or access denied message
      const url = page.url();
      const hasAccessDenied = await page.locator('text="access denied"').or(
        page.locator('text="permission"')
      ).count() > 0;

      expect(url.includes("users") && !hasAccessDenied).toBeFalsy();
    });
  });

  test.describe("Role-Based Access - Student", () => {
    test("student can access dashboard", async ({ page }) => {
      await loginAs(page, TEST_USERS.STUDENT);
      await page.goto("/dashboard");

      await expect(page.url()).not.toContain("login");
    });

    test("student cannot access user management", async ({ page }) => {
      await loginAs(page, TEST_USERS.STUDENT);
      await page.goto("/users");

      // Should be redirected or show access denied
      const url = page.url();
      const hasAccessDenied = await page.locator('text="access denied"').or(
        page.locator('text="permission"')
      ).count() > 0;

      expect(url.includes("users") && !hasAccessDenied).toBeFalsy();
    });

    test("student cannot access courses management", async ({ page }) => {
      await loginAs(page, TEST_USERS.STUDENT);
      await page.goto("/courses");

      const url = page.url();
      const hasAccessDenied = await page.locator('text="access denied"').or(
        page.locator('text="permission"')
      ).count() > 0;

      expect(url.includes("courses") && !hasAccessDenied).toBeFalsy();
    });
  });

  test.describe("Return URL Handling", () => {
    test("preserves return URL after login", async ({ page }) => {
      // Try to access a protected page
      await page.goto("/users");

      // Should redirect to login with return URL
      await page.waitForURL(/.*login/);

      // Login
      await page.fill('input[type="email"]', TEST_USERS.OWNER.email);
      await page.fill('input[type="password"]', TEST_USERS.OWNER.password);
      await page.click('button[type="submit"]');

      // Should redirect back to the originally requested page
      await page.waitForURL(/\/(users|dashboard)/, { timeout: 10000 });
    });
  });
});
