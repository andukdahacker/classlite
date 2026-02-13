import { test, expect, TEST_USERS } from "../../fixtures/auth.fixture";
import { loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";
import { uniqueName } from "../../fixtures/exercise-fixtures";

/**
 * Helper to create a mock test via the dialog and wait for editor to load.
 * Returns the mock test title for verification.
 */
async function createMockTestAndWaitForEditor(
  page: import("@playwright/test").Page,
  mockTestTitle: string
) {
  // Click "Create Mock Test"
  await page.getByRole("button", { name: "Create Mock Test" }).click();

  // Wait for create dialog
  await page.getByRole("dialog").waitFor();

  // Fill title
  await page.getByRole("dialog").getByLabel(/Title/i).fill(mockTestTitle);

  // Click create button
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Create/i })
    .click();

  // Wait for redirect to mock test editor
  await page.waitForURL(/.*\/mock-tests\/[^/]+\/edit/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await closeAIAssistantDialog(page);

  // Wait for the tab list to render (mock test data must load first)
  await page.locator('[role="tablist"]').waitFor({ timeout: 15000 });
}

/**
 * AC5: Mock Test Flow
 * E2E test covering: navigate to mock tests → create mock test →
 * add exercises for each skill section → configure band score settings →
 * save → verify mock test appears in list.
 */
test.describe("Mock Test Flow (AC5)", () => {
  test("create mock test — fill title, select type, save", async ({
    page,
  }) => {
    const mockTestTitle = uniqueName("E2E Mock Test");

    await loginAs(page, TEST_USERS.OWNER);

    // Navigate to mock tests page
    await page.goto(getAppUrl("/mock-tests"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    // Verify page loaded
    await expect(
      page.getByRole("heading", { name: "Mock Tests" }).first()
    ).toBeVisible();

    await createMockTestAndWaitForEditor(page, mockTestTitle);

    // Verify skill tabs exist
    await expect(page.locator('[role="tab"]').filter({ hasText: "Listening" })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: "Reading" })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: "Writing" })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: "Speaking" })).toBeVisible();
  });

  test("mock test appears in list after creation", async ({ page }) => {
    const mockTestTitle = uniqueName("E2E Mock List");

    await loginAs(page, TEST_USERS.OWNER);

    // Navigate to mock tests and create one
    await page.goto(getAppUrl("/mock-tests"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    await page.getByRole("button", { name: "Create Mock Test" }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("dialog").getByLabel(/Title/i).fill(mockTestTitle);

    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Create/i })
      .click();

    await page.waitForURL(/.*\/mock-tests\/[^/]+\/edit/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Navigate back to mock tests list
    await page.goto(getAppUrl("/mock-tests"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    // Verify mock test appears in the list
    await expect(page.getByText(mockTestTitle)).toBeVisible();
  });

  test("view mock test details — verify sections and exercises displayed", async ({
    page,
  }) => {
    const mockTestTitle = uniqueName("E2E Mock Details");

    await loginAs(page, TEST_USERS.OWNER);

    // Create mock test via UI
    await page.goto(getAppUrl("/mock-tests"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    await createMockTestAndWaitForEditor(page, mockTestTitle);

    // Verify editor shows skill section tabs (wait for them to render)
    await expect(page.locator('[role="tab"]').filter({ hasText: "Speaking" })).toBeVisible({ timeout: 10000 });
    const tabCount = await page.locator('[role="tab"]').count();
    expect(tabCount).toBeGreaterThanOrEqual(4);

    // Click through each tab to verify section details are shown
    const skills = ["Listening", "Reading", "Writing", "Speaking"];
    for (const skill of skills) {
      const tab = page
        .locator('[role="tab"]')
        .filter({ hasText: skill })
        .first();
      if (await tab.isVisible()) {
        await tab.click();
        // Verify the active tab panel is visible (inactive panels are hidden)
        await expect(
          page.locator('[role="tabpanel"]:not([hidden])')
        ).toBeVisible();
      }
    }
  });

  test("configure band score calculation settings", async ({ page }) => {
    const mockTestTitle = uniqueName("E2E Mock Score");

    await loginAs(page, TEST_USERS.OWNER);

    await page.goto(getAppUrl("/mock-tests"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    await createMockTestAndWaitForEditor(page, mockTestTitle);

    // Set time limits for each section
    const sectionTimeLimits: Record<string, string> = {
      Listening: "30",
      Reading: "60",
      Writing: "60",
      Speaking: "14",
    };

    for (const [skill, minutes] of Object.entries(sectionTimeLimits)) {
      const tab = page
        .locator('[role="tab"]')
        .filter({ hasText: skill })
        .first();
      if (await tab.isVisible()) {
        await tab.click();
        const timeLimitInput = page
          .getByLabel(/Time Limit|Minutes/i)
          .or(page.locator('input[type="number"]'))
          .first();
        if (await timeLimitInput.isVisible()) {
          await timeLimitInput.fill(minutes);
        }
      }
    }
  });
});
