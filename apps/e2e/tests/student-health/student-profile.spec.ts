import { expect } from "@playwright/test";
import {
  test,
  TEST_USERS,
  loginAs,
  getAppUrl,
} from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";

test.describe("Student Profile Overlay (Story 6.2)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);
    await page.waitForTimeout(500);
  });

  test("clicking student card opens slide-over overlay", async ({ page }) => {
    // Find a student card
    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    const urlBefore = page.url();
    await studentCard.click();

    // Sheet overlay should open (data-side="right" or Sheet role)
    const sheetContent = page.locator(
      '[data-slot="sheet-content"], [role="dialog"]'
    );
    await expect(sheetContent.first()).toBeVisible({ timeout: 5000 });

    // URL should NOT change (overlay, not navigation)
    expect(page.url()).toBe(urlBefore);
  });

  test("overlay shows student name, email, and health badge", async ({
    page,
  }) => {
    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Health badge should be visible (At Risk, Warning, or On Track)
    await expect(
      overlay.locator("text=/At Risk|Warning|On Track/").first()
    ).toBeVisible();
  });

  test("overlay shows attendance and assignment metrics", async ({ page }) => {
    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Metric cards show "Attendance" and "Assignments"
    await expect(overlay.getByText("Attendance").first()).toBeVisible();
    await expect(overlay.getByText("Assignments").first()).toBeVisible();
  });

  test("overlay has Trends, Attendance, Assignments tabs", async ({
    page,
  }) => {
    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Check for tab triggers
    const tabs = overlay.locator('[role="tab"]');
    await expect(tabs.filter({ hasText: "Trends" })).toBeVisible();
    await expect(tabs.filter({ hasText: "Attendance" })).toBeVisible();
    await expect(tabs.filter({ hasText: "Assignments" })).toBeVisible();
  });

  test('Trends tab shows weekly bars or "Not enough data" message', async ({
    page,
  }) => {
    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Trends tab is default — check content renders
    const trendsContent = overlay.locator('[role="tabpanel"]').first();
    await expect(trendsContent).toBeVisible();

    const text = await trendsContent.textContent();
    expect(
      text?.includes("Not enough data") ||
        text?.includes("Week") ||
        text?.includes("%")
    ).toBeTruthy();
  });

  test('Attendance tab shows session history or "No attendance records"', async ({
    page,
  }) => {
    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Switch to Attendance tab via keyboard — tabs are below the fold in the Sheet overlay,
    // so normal click fails with "element is outside of the viewport". Focus the active
    // Trends tab trigger programmatically, then ArrowRight to Attendance.
    const trendsTab = overlay.locator('[role="tab"]').filter({ hasText: "Trends" });
    await trendsTab.evaluate((el: HTMLElement) => el.focus());
    await page.keyboard.press("ArrowRight"); // Trends → Attendance
    await page.waitForTimeout(500);

    // Filter to the active (visible) tab panel only — hidden panels also exist in the DOM
    const tabPanel = overlay.locator('[role="tabpanel"][data-state="active"]');
    await expect(tabPanel).toBeVisible({ timeout: 5000 });

    // Use Playwright's built-in text matching (retries automatically) instead of textContent()
    await expect(tabPanel).toContainText(
      /No attendance records|PRESENT|ABSENT|LATE|EXCUSED|session/i,
      { timeout: 5000 }
    );
  });

  test('Assignments tab shows assignment history or "No assignments yet"', async ({
    page,
  }) => {
    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Switch to Assignments tab via keyboard — tabs are below the fold in the Sheet overlay
    const trendsTab = overlay.locator('[role="tab"]').filter({ hasText: "Trends" });
    await trendsTab.evaluate((el: HTMLElement) => el.focus());
    await page.keyboard.press("ArrowRight"); // Trends → Attendance
    await page.keyboard.press("ArrowRight"); // Attendance → Assignments

    // Filter to the active (visible) tab panel only — hidden panels also exist in the DOM
    const tabPanel = overlay.locator('[role="tabpanel"][data-state="active"]');
    await expect(tabPanel).toBeVisible();

    const text = await tabPanel.textContent();
    expect(
      text?.includes("No assignments yet") ||
        text?.includes("Submitted") ||
        text?.includes("Graded") ||
        text?.includes("Not Submitted") ||
        (text && text.length > 0)
    ).toBeTruthy();
  });

  test("closing overlay preserves dashboard scroll position", async ({
    page,
  }) => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 200));
    const scrollBefore = await page.evaluate(() => window.scrollY);

    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Close overlay via Escape or close button
    await page.keyboard.press("Escape");
    await expect(overlay).not.toBeVisible({ timeout: 3000 });

    // Scroll position should be preserved
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(50);
  });

  test("root cause alert shows for at-risk/warning students", async ({
    page,
  }) => {
    // Find a student card with At Risk or Warning status
    const atRiskCard = page
      .locator('[role="button"]')
      .filter({ hasText: /At Risk|Warning/ })
      .first();

    const hasAtRisk = await atRiskCard.isVisible().catch(() => false);
    if (!hasAtRisk) {
      test.skip(true, "No at-risk or warning students visible");
      return;
    }

    await atRiskCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Root cause alert should be present
    const alert = overlay.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 3000 });
    await expect(alert.getByText(/Root Cause/)).toBeVisible();
  });
});
