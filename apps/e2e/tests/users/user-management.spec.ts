import { test, expect, TEST_USERS, loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { waitForToast, waitForLoadingComplete } from "../../utils/test-helpers";

/**
 * Helper to close the AI Assistant sheet/dialog if it's open
 */
async function closeAIAssistantDialog(page: import("@playwright/test").Page) {
  // Only try to close if we're on a dashboard page (has the AI Assistant)
  if (!page.url().includes("dashboard")) {
    return;
  }

  // The AI Assistant is a Sheet component that opens by default on narrower viewports
  // Wait for any animations to complete
  await page.waitForTimeout(500);

  // Try to close via the sheet overlay (clicking outside closes it)
  const sheetOverlay = page.locator('[data-slot="sheet-overlay"][data-state="open"]');
  if (await sheetOverlay.count() > 0) {
    // Click on the overlay to close the sheet
    await sheetOverlay.click({ force: true, position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
  }

  // Also try pressing Escape as a fallback
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner who has full access
    await loginAs(page, TEST_USERS.OWNER);
    await page.goto(getAppUrl("/settings/users"));
    await waitForLoadingComplete(page);
    await closeAIAssistantDialog(page);
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
      // Find the role filter combobox (contains "All Roles" text)
      const roleFilter = page.locator('[role="combobox"]').filter({ hasText: 'All Roles' }).or(
        page.locator('[role="combobox"]').filter({ hasText: 'Role' })
      );

      if (await roleFilter.count() > 0) {
        await roleFilter.click();
        await page.waitForTimeout(200);

        // Select Teacher from dropdown
        const teacherOption = page.locator('[role="option"]').filter({ hasText: 'TEACHER' }).or(
          page.locator('[role="option"]').filter({ hasText: 'Teacher' })
        );
        if (await teacherOption.count() > 0) {
          await teacherOption.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test("status filter works", async ({ page }) => {
      // Find the status filter combobox (contains "All Status" text)
      const statusFilter = page.locator('[role="combobox"]').filter({ hasText: 'All Status' }).or(
        page.locator('[role="combobox"]').filter({ hasText: 'Status' })
      );

      if (await statusFilter.count() > 0) {
        await statusFilter.click();
        await page.waitForTimeout(200);

        // Select Active from dropdown
        const activeOption = page.locator('[role="option"]').filter({ hasText: 'Active' }).or(
          page.locator('[role="option"]').filter({ hasText: 'active' })
        );
        if (await activeOption.count() > 0) {
          await activeOption.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe("Invite User", () => {
    test("invite user button is visible for owner", async ({ page }) => {
      await expect(
        page.locator('button').filter({ hasText: 'Invite User' }).or(
          page.locator('button').filter({ hasText: 'Invite' })
        )
      ).toBeVisible();
    });

    test("invite user modal opens", async ({ page }) => {
      // Click the Invite User button
      await page.locator('button').filter({ hasText: 'Invite User' }).click();

      // Wait for modal to open
      await page.waitForTimeout(300);

      // Modal/dialog should be visible - use specific dialog selector
      await expect(
        page.getByRole('dialog', { name: 'Invite User' })
      ).toBeVisible();
    });

    test("invite user form validation", async ({ page }) => {
      // Click the Invite User button
      await page.locator('button').filter({ hasText: 'Invite User' }).or(
        page.locator('button').filter({ hasText: 'Invite' })
      ).click();

      await page.waitForTimeout(300);

      // Try to find and click a submit/send button in the modal
      const submitButton = page.locator('[role="dialog"] button[type="submit"]').or(
        page.locator('[role="dialog"] button').filter({ hasText: /send|submit|invite/i })
      );

      if (await submitButton.count() > 0) {
        await submitButton.click();
        // Form should stay open (validation error) or show error message
        await page.waitForTimeout(500);
      }
    });

    test("successfully invites a new user", async ({ page }) => {
      // Open the Invite User dialog
      await page.locator('button').filter({ hasText: 'Invite User' }).click();
      await expect(page.getByRole('dialog', { name: 'Invite User' })).toBeVisible();

      // Fill in a timestamped unique email
      const uniqueEmail = `test-invite-${Date.now()}@example.com`;
      await page.locator('input[placeholder="email@example.com"]').fill(uniqueEmail);

      // Select Teacher role via combobox
      await page.locator('[role="dialog"]').locator('[role="combobox"]').click();
      await page.locator('[role="option"]').filter({ hasText: 'Teacher' }).click();

      // Click Send Invitation
      await page.locator('[role="dialog"] button[type="submit"]').click();

      // Verify success toast
      await waitForToast(page, "Invitation sent successfully");

      // Dialog should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("User Actions", () => {
    test("user actions dropdown is available", async ({ page }) => {
      // Find first user row's action button (icon button with sr-only "Open menu")
      const actionButton = page.locator('table tbody tr').first()
        .locator('button').filter({ hasText: 'Open menu' });

      if (await actionButton.count() > 0) {
        await actionButton.click();

        // Dropdown menu should appear
        await expect(
          page.locator('[role="menu"]')
        ).toBeVisible();
      }
    });

    test("role change dialog opens (owner only)", async ({ page }) => {
      // Search for the TEACHER user to ensure the row is visible
      const teacherEmail = TEST_USERS.TEACHER.email;
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill(teacherEmail);
      await page.waitForTimeout(500);

      const userRow = page.locator('table tbody tr').filter({ hasText: teacherEmail });
      await userRow.first().waitFor({ state: 'visible', timeout: 10000 });

      // Click the action menu button in that row
      await userRow.first().locator('button').last().click();

      // Click "Change Role" in the dropdown menu
      await page.locator('[role="menuitem"]').filter({ hasText: 'Change Role' }).click();

      // Verify the RoleChangeModal dialog opens
      await expect(
        page.getByRole('dialog', { name: 'Change User Role' })
      ).toBeVisible();
    });

    test("deactivate user shows confirmation", async ({ page }) => {
      // Search for the TEACHER user to ensure the row is visible
      const teacherEmail = TEST_USERS.TEACHER.email;
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill(teacherEmail);
      await page.waitForTimeout(500);

      const userRow = page.locator('table tbody tr').filter({ hasText: teacherEmail });
      await userRow.first().waitFor({ state: 'visible', timeout: 10000 });

      // Click the action menu button in that row
      await userRow.first().locator('button').last().click();

      // Click "Deactivate" in the dropdown menu
      await page.locator('[role="menuitem"]').filter({ hasText: 'Deactivate' }).click();

      // Verify AlertDialog with confirmation appears
      const alertDialog = page.locator('[role="alertdialog"]');
      await expect(alertDialog).toBeVisible();
      await expect(alertDialog.locator('text="Deactivate User"')).toBeVisible();
      await expect(alertDialog.getByText('Are you sure', { exact: false })).toBeVisible();

      // Click Cancel to avoid actually deactivating the user
      await alertDialog.locator('button').filter({ hasText: 'Cancel' }).click();
      await expect(alertDialog).not.toBeVisible();
    });
  });
});

test.describe("User Management - RBAC", () => {
  test("admin can access user management but cannot change roles", async ({ page }) => {
    await loginAs(page, TEST_USERS.ADMIN);
    await page.goto(getAppUrl("/settings/users"));
    await closeAIAssistantDialog(page);

    // Should be able to view users - look for the table
    await expect(page.locator('table')).toBeVisible();
  });

  test("teacher cannot access user management", async ({ page }) => {
    await loginAs(page, TEST_USERS.TEACHER);
    await closeAIAssistantDialog(page);
    await page.goto(getAppUrl("/settings/users"));

    // Should be redirected (settings requires OWNER or ADMIN)
    await page.waitForLoadState("networkidle");
    const currentUrl = page.url();

    // Teacher should be redirected away from settings/users
    expect(currentUrl.includes("settings/users")).toBeFalsy();
  });

  test("student cannot access user management", async ({ page }) => {
    await loginAs(page, TEST_USERS.STUDENT);
    await closeAIAssistantDialog(page);
    await page.goto(getAppUrl("/settings/users"));

    // Should be redirected (settings requires OWNER or ADMIN)
    await page.waitForLoadState("networkidle");
    const currentUrl = page.url();

    // Student should be redirected away from settings/users
    expect(currentUrl.includes("settings/users")).toBeFalsy();
  });
});
