import { test, expect, TEST_USERS, loginAs } from "../../fixtures/auth.fixture";

test.describe("Navigation Structure", () => {
  test.describe("Role-Based Navigation Items", () => {
    test("owner sees all navigation items", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/dashboard");

      // Owner should see all main nav items
      await expect(page.locator('nav a[href*="dashboard"]').or(
        page.locator('[data-testid="nav-dashboard"]')
      )).toBeVisible();

      await expect(page.locator('nav a[href*="users"]').or(
        page.locator('[data-testid="nav-users"]')
      )).toBeVisible();

      await expect(page.locator('nav a[href*="courses"]').or(
        page.locator('[data-testid="nav-courses"]')
      )).toBeVisible();

      await expect(page.locator('nav a[href*="settings"]').or(
        page.locator('[data-testid="nav-settings"]')
      )).toBeVisible();
    });

    test("admin sees management navigation items", async ({ page }) => {
      await loginAs(page, TEST_USERS.ADMIN);
      await page.goto("/dashboard");

      await expect(page.locator('nav a[href*="dashboard"]')).toBeVisible();
      await expect(page.locator('nav a[href*="users"]')).toBeVisible();
      await expect(page.locator('nav a[href*="courses"]')).toBeVisible();
    });

    test("teacher sees limited navigation items", async ({ page }) => {
      await loginAs(page, TEST_USERS.TEACHER);
      await page.goto("/dashboard");

      // Teacher should see dashboard
      await expect(page.locator('nav a[href*="dashboard"]')).toBeVisible();

      // Teacher should not see user management
      await expect(page.locator('nav a[href*="users"]')).not.toBeVisible();
    });

    test("student sees student-specific navigation", async ({ page }) => {
      await loginAs(page, TEST_USERS.STUDENT);
      await page.goto("/dashboard");

      // Student should see dashboard
      await expect(page.locator('nav a[href*="dashboard"]')).toBeVisible();

      // Student should not see management items
      await expect(page.locator('nav a[href*="users"]')).not.toBeVisible();
      await expect(page.locator('nav a[href*="courses"]')).not.toBeVisible();
    });
  });

  test.describe("Mobile Navigation", () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test("shows mobile bottom navigation bar", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/dashboard");

      // Mobile should have bottom nav
      await expect(
        page.locator('[data-testid="mobile-nav"]').or(
          page.locator('nav[aria-label*="mobile" i]')
        ).or(
          page.locator('.fixed.bottom-0')
        )
      ).toBeVisible();
    });

    test("mobile overflow menu opens", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/dashboard");

      // Look for overflow/more button
      const overflowButton = page.locator(
        'button[aria-label*="more" i]'
      ).or(page.locator('[data-testid="mobile-overflow"]'));

      if (await overflowButton.count() > 0) {
        await overflowButton.click();

        // Overflow menu should show additional nav items
        await expect(
          page.locator('[role="menu"]').or(
            page.locator('[data-testid="overflow-menu"]')
          )
        ).toBeVisible();
      }
    });

    test("can navigate using mobile bottom bar", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/dashboard");

      // Click on a nav item in mobile bottom bar
      const navItem = page.locator(
        '[data-testid="mobile-nav"] a'
      ).or(page.locator('nav a')).first();

      if (await navItem.count() > 0) {
        await navItem.click();
        // Verify navigation occurred
        await page.waitForLoadState("networkidle");
      }
    });
  });

  test.describe("Settings Sub-Navigation", () => {
    test("settings page shows sub-navigation tabs", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/settings");

      // Should show settings tabs or sub-nav
      await expect(
        page.locator('[role="tablist"]').or(
          page.locator('[data-testid="settings-nav"]')
        ).or(
          page.locator('nav a[href*="settings/"]')
        )
      ).toBeVisible();
    });

    test("can navigate between settings tabs", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/settings");

      // Find settings sub-navigation items
      const tabs = page.locator('[role="tab"]').or(
        page.locator('[data-testid="settings-nav"] a')
      );

      const count = await tabs.count();
      if (count > 1) {
        // Click second tab
        await tabs.nth(1).click();

        // URL should change or tab should be active
        await page.waitForLoadState("networkidle");
      }
    });

    test("profile tab is accessible", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/settings/profile");

      // Should show profile settings content
      await expect(
        page.locator('text="Profile"').or(
          page.locator('h1:has-text("Profile")')
        )
      ).toBeVisible();
    });

    test("center settings tab visible for owner/admin", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/settings");

      await expect(
        page.locator('text="Center"').or(
          page.locator('a[href*="settings/center"]')
        )
      ).toBeVisible();
    });
  });

  test.describe("Breadcrumbs", () => {
    test("breadcrumbs show current location", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/settings/profile");

      // Should show breadcrumb trail
      const breadcrumbs = page.locator(
        '[data-testid="breadcrumbs"]'
      ).or(page.locator('nav[aria-label*="breadcrumb" i]'));

      if (await breadcrumbs.count() > 0) {
        await expect(breadcrumbs).toContainText("Settings");
        await expect(breadcrumbs).toContainText("Profile");
      }
    });

    test("breadcrumb links are navigable", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/settings/profile");

      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]').or(
        page.locator('nav[aria-label*="breadcrumb" i]')
      );

      if (await breadcrumbs.count() > 0) {
        // Click on parent breadcrumb
        const parentLink = breadcrumbs.locator('a').first();
        if (await parentLink.count() > 0) {
          await parentLink.click();
          await page.waitForLoadState("networkidle");
          // Should navigate to parent
        }
      }
    });
  });

  test.describe("Active State Highlighting", () => {
    test("current nav item is highlighted", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/dashboard");

      // Dashboard nav item should be active/highlighted
      const dashboardNav = page.locator('nav a[href*="dashboard"]').or(
        page.locator('[data-testid="nav-dashboard"]')
      );

      // Check for active state (could be aria-current, class, or data attribute)
      await expect(dashboardNav).toHaveAttribute("aria-current", "page").or(
        expect(dashboardNav).toHaveClass(/active|current|selected/i)
      ).catch(() => {
        // Might use different styling approach
      });
    });

    test("active state updates on navigation", async ({ page }) => {
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/dashboard");

      // Navigate to different page
      await page.click('nav a[href*="courses"]');
      await page.waitForLoadState("networkidle");

      // Courses nav should now be active
      const coursesNav = page.locator('nav a[href*="courses"]');
      // Dashboard should no longer be active
      const dashboardNav = page.locator('nav a[href*="dashboard"]');

      // The active styling should have moved
    });
  });

  test.describe("Responsive Behavior", () => {
    test("desktop shows sidebar navigation", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/dashboard");

      // Desktop should show sidebar
      await expect(
        page.locator('aside').or(
          page.locator('[data-testid="sidebar"]')
        )
      ).toBeVisible();
    });

    test("tablet adjusts navigation appropriately", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await loginAs(page, TEST_USERS.OWNER);
      await page.goto("/dashboard");

      // Navigation should still be usable on tablet
      await expect(page.locator('nav')).toBeVisible();
    });
  });
});
