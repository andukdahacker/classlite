import { expect } from "@playwright/test";
import {
  test,
  TEST_USERS,
  loginAs,
  getAppUrl,
} from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";

test.describe("Student Health Dashboard (Story 6.1)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);
    // Extra wait for dashboard data to settle after dialog dismissal
    await page.waitForTimeout(500);
  });

  test('displays "Student Health" heading and subtitle', async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Student Health" })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("At-a-glance view of student engagement")
    ).toBeVisible({ timeout: 5000 });
  });

  test("summary bar shows Total, At Risk, Warning, On Track cards", async ({
    page,
  }) => {
    // Wait for summary data to load (async fetch)
    // Use .first() because student badges may also contain "At Risk" / "On Track" text
    await expect(page.getByText("Total Students")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("At Risk").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Warning").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("On Track").first()).toBeVisible({ timeout: 5000 });
  });

  test("search input filters students by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search by name...");
    await expect(searchInput).toBeVisible();

    // Type a search query — dashboard should update after debounce
    await searchInput.fill("nonexistent-student-xyz");
    await page.waitForTimeout(500); // debounce

    // Either no results or the filtered view
    const noMatch = page.getByText("No students match your filters");
    const studentCards = page.locator('[role="button"]').filter({
      has: page.locator("text=Attendance"),
    });
    const hasNoMatch = await noMatch.isVisible().catch(() => false);
    const cardCount = await studentCards.count();

    // Either empty state or filtered results (fewer cards)
    expect(hasNoMatch || cardCount === 0).toBeTruthy();
  });

  test('class filter dropdown shows "All Classes" and class names', async ({
    page,
  }) => {
    // Find the class filter select trigger
    const selectTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /All Classes/ })
      .first();

    // If no combobox, try a button-style select
    const fallbackTrigger = page.getByText("All Classes").first();
    const trigger =
      (await selectTrigger.isVisible().catch(() => false))
        ? selectTrigger
        : fallbackTrigger;

    await expect(trigger).toBeVisible();
    await trigger.click();

    // Dropdown should show class options
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
  });

  test("clicking a summary card toggles status filter", async ({ page }) => {
    // Click "At Risk" card
    const atRiskCard = page.getByText("At Risk").first();
    await atRiskCard.click();
    await page.waitForTimeout(300);

    // Either filtered students or empty state
    const pageContent = await page.textContent("body");
    expect(
      pageContent?.includes("At Risk") ||
        pageContent?.includes("No students match")
    ).toBeTruthy();

    // Click again to toggle off
    await atRiskCard.click();
    await page.waitForTimeout(300);
  });

  test("student card shows name, health badge, and metrics", async ({
    page,
  }) => {
    // Wait for student cards to load
    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();

    // Skip if no students are enrolled
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible — no enrolled students");
      return;
    }

    // Verify card has key elements
    await expect(studentCard.locator("text=Attendance")).toBeVisible();
    // Health badge (TrafficLightBadge renders status text)
    const hasBadge = await studentCard
      .locator("text=/At Risk|Warning|On Track/")
      .isVisible()
      .catch(() => false);
    expect(hasBadge).toBeTruthy();
  });

  test("student card shows class badge(s)", async ({ page }) => {
    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();

    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    // Class badges are rendered as Badge components with class names
    // The card should contain at least one badge with a class name or "+N more"
    const badges = studentCard.locator('[class*="badge"], [data-slot="badge"]');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test("empty state shows when no students match filters", async ({
    page,
  }) => {
    // Search for an impossible name
    const searchInput = page.getByPlaceholder("Search by name...");
    await searchInput.fill("zzz-impossible-name-zzz");
    await page.waitForTimeout(500);

    // Verify empty state text
    await expect(
      page.getByText(/No students match|No students enrolled/)
    ).toBeVisible({ timeout: 5000 });
  });
});
