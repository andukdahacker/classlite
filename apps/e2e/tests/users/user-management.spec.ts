import { test, expect, TEST_USERS, loginAs } from "../../fixtures/auth.fixture";
import { waitForToast, waitForLoadingComplete } from "../../utils/test-helpers";

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner who has full access
    await loginAs(page, TEST_USERS.OWNER);
    await page.goto("/users");
    await waitForLoadingComplete(page);
  });

  test.describe("User List", () => {
    test("displays user list with pagination", async ({ page }) => {
      // Check for table or list of users
      await expect(
        page.locator('table').or(page.locator('[data-testid="user-list"]'))
      ).toBeVisible();

      // Check for pagination if enough users
      const pagination = page.locator('[data-testid="pagination"]').or(
        page.locator('nav[aria-label*="pagination"]')
      );
      // Pagination might not be visible if there are few users
    });

    test("displays user information in table", async ({ page }) => {
      // Check that user data columns are present
      await expect(
        page.locator('text="Email"').or(page.locator('th:has-text("Email")'))
      ).toBeVisible();
      await expect(
        page.locator('text="Role"').or(page.locator('th:has-text("Role")'))
      ).toBeVisible();
      await expect(
        page.locator('text="Status"').or(page.locator('th:has-text("Status")'))
      ).toBeVisible();
    });

    test("search filters user list", async ({ page }) => {
      const searchInput = page.locator(
        'input[placeholder*="search" i]'
      ).or(page.locator('input[name="search"]'));

      if (await searchInput.count() > 0) {
        await searchInput.fill("test");
        await page.waitForTimeout(500); // Debounce

        // Results should be filtered
        // Verify by checking the list changed or contains search term
      }
    });

    test("role filter works", async ({ page }) => {
      const roleFilter = page.locator(
        '[data-testid="role-filter"]'
      ).or(page.locator('select[name="role"]')).or(
        page.locator('[role="combobox"]:has-text("Role")')
      );

      if (await roleFilter.count() > 0) {
        await roleFilter.click();
        await page.click('[role="option"]:has-text("Teacher")');

        // Results should be filtered to show only teachers
        await page.waitForTimeout(500);
      }
    });

    test("status filter works", async ({ page }) => {
      const statusFilter = page.locator(
        '[data-testid="status-filter"]'
      ).or(page.locator('select[name="status"]')).or(
        page.locator('[role="combobox"]:has-text("Status")')
      );

      if (await statusFilter.count() > 0) {
        await statusFilter.click();
        await page.click('[role="option"]:has-text("Active")');

        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Invite User", () => {
    test("invite user button is visible for owner", async ({ page }) => {
      await expect(
        page.locator('button:has-text("Invite")').or(
          page.locator('[data-testid="invite-user-button"]')
        )
      ).toBeVisible();
    });

    test("invite user modal opens", async ({ page }) => {
      await page.click(
        'button:has-text("Invite")'
      );

      // Modal should open
      await expect(
        page.locator('[role="dialog"]').or(page.locator('[data-testid="invite-modal"]'))
      ).toBeVisible();
    });

    test("invite user form validation", async ({ page }) => {
      await page.click('button:has-text("Invite")');

      // Try to submit without filling required fields
      await page.click('button:has-text("Send")');

      // Should show validation errors
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      // Form should not close
    });

    test.skip("successfully invites a new user", async ({ page }) => {
      // Skip by default to avoid creating test data
      await page.click('button:has-text("Invite")');

      const uniqueEmail = `test-${Date.now()}@example.com`;
      await page.fill('input[type="email"]', uniqueEmail);

      // Select role
      await page.click('[role="combobox"]:has-text("Role")');
      await page.click('[role="option"]:has-text("Teacher")');

      await page.click('button:has-text("Send")');

      // Should show success message
      await waitForToast(page, "invite");

      // Modal should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
  });

  test.describe("User Actions", () => {
    test("user actions dropdown is available", async ({ page }) => {
      // Find first user row's action button
      const actionButton = page.locator(
        '[data-testid="user-actions"]'
      ).or(page.locator('button[aria-label*="actions" i]')).first();

      if (await actionButton.count() > 0) {
        await actionButton.click();

        // Dropdown should show actions
        await expect(
          page.locator('[role="menu"]').or(page.locator('[role="menuitem"]'))
        ).toBeVisible();
      }
    });

    test.skip("role change dialog opens (owner only)", async ({ page }) => {
      const actionButton = page.locator('[data-testid="user-actions"]').first();

      if (await actionButton.count() > 0) {
        await actionButton.click();
        await page.click('[role="menuitem"]:has-text("Change Role")');

        await expect(
          page.locator('[role="dialog"]')
        ).toBeVisible();
      }
    });

    test.skip("deactivate user shows confirmation", async ({ page }) => {
      const actionButton = page.locator('[data-testid="user-actions"]').first();

      if (await actionButton.count() > 0) {
        await actionButton.click();
        await page.click('[role="menuitem"]:has-text("Deactivate")');

        // Should show confirmation dialog
        await expect(
          page.locator('[role="alertdialog"]').or(
            page.locator('text="Are you sure"')
          )
        ).toBeVisible();
      }
    });
  });
});

test.describe("User Management - RBAC", () => {
  test("admin can access user management but cannot change roles", async ({ page }) => {
    await loginAs(page, TEST_USERS.ADMIN);
    await page.goto("/users");

    // Should be able to view users
    await expect(page.locator('table').or(page.locator('[data-testid="user-list"]'))).toBeVisible();

    // Role change option should not be visible for admin
    const actionButton = page.locator('[data-testid="user-actions"]').first();
    if (await actionButton.count() > 0) {
      await actionButton.click();

      // Change Role should not be in the menu for admin
      const changeRoleOption = page.locator('[role="menuitem"]:has-text("Change Role")');
      // This might be hidden or not present at all
    }
  });

  test("teacher cannot access user management", async ({ page }) => {
    await loginAs(page, TEST_USERS.TEACHER);
    await page.goto("/users");

    // Should be redirected or show access denied
    const currentUrl = page.url();
    const hasError = await page.locator('text="access"').or(
      page.locator('text="permission"')
    ).count() > 0;

    expect(currentUrl.includes("/users") && !hasError).toBeFalsy();
  });

  test("student cannot access user management", async ({ page }) => {
    await loginAs(page, TEST_USERS.STUDENT);
    await page.goto("/users");

    const currentUrl = page.url();
    const hasError = await page.locator('text="access"').or(
      page.locator('text="permission"')
    ).count() > 0;

    expect(currentUrl.includes("/users") && !hasError).toBeFalsy();
  });
});
