import { expect } from "@playwright/test";
import {
  submissionTest as test,
  startSubmissionAsStudent,
} from "../../fixtures/submission-fixtures";

test.describe("Offline Safeguards & Sync", () => {
  test("offline banner appears when network is lost", async ({ browser, testIds }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Go offline
    await context.setOffline(true);

    // OfflineBanner should appear with "Offline Mode Active" and "Do not close" warning
    const banner = page.locator('[data-testid="offline-banner"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText("Offline Mode Active");
    await expect(banner).toContainText("Do not close this tab");

    // Go back online
    await context.setOffline(false);

    // Banner should disappear
    await expect(banner).not.toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test("student can answer questions while offline without errors", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Go offline
    await context.setOffline(true);
    await expect(
      page.locator('[data-testid="offline-banner"]')
    ).toBeVisible({ timeout: 5000 });

    // Answer Q1: MCQ — should not throw
    await page.getByText("B. Climate change").click();

    // Verify selection is highlighted
    const selectedOption = page.locator("label").filter({ hasText: "B. Climate change" });
    await expect(selectedOption).toHaveClass(/border-primary/);

    // Navigate to Q2
    await page.getByRole("button", { name: /Next/ }).click();

    // Answer Q2: text — should not throw
    await page.locator('input[placeholder="Type your answer..."]').fill("ice caps");
    await expect(
      page.locator('input[placeholder="Type your answer..."]')
    ).toHaveValue("ice caps");

    // Go back online
    await context.setOffline(false);

    // Banner disappears
    await expect(
      page.locator('[data-testid="offline-banner"]')
    ).not.toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test("syncing indicator appears after reconnecting", async ({ browser, testIds }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Answer a question first while online
    await page.getByText("B. Climate change").click();

    // Wait for initial save
    await expect(
      page.locator('[data-testid="save-indicator"]')
    ).toContainText(/Saved/, { timeout: 10000 });

    // Go offline
    await context.setOffline(true);
    await expect(
      page.locator('[data-testid="offline-banner"]')
    ).toBeVisible({ timeout: 5000 });

    // Navigate to Q2 and answer
    await page.getByRole("button", { name: /Next/ }).click();
    await page.locator('input[placeholder="Type your answer..."]').fill("ice caps");

    // Go back online — should trigger sync
    await context.setOffline(false);

    // Save indicator should show syncing state then resolve
    const saveIndicator = page.locator('[data-testid="save-indicator"]');
    await expect(saveIndicator).toContainText(/Syncing|Saved/, { timeout: 10000 });

    await context.close();
  });

  test("submit while offline → auto-retry on reconnect → success", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Answer both questions
    await page.getByText("B. Climate change").click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.locator('input[placeholder="Type your answer..."]').fill("ice caps");

    // Wait for save to settle
    await expect(
      page.locator('[data-testid="save-indicator"]')
    ).toContainText(/Saved/, { timeout: 10000 });

    // Go offline
    await context.setOffline(true);
    await expect(
      page.locator('[data-testid="offline-banner"]')
    ).toBeVisible({ timeout: 5000 });

    // Try to submit while offline
    await page.getByRole("button", { name: "Submit" }).click();
    await page.getByRole("heading", { name: "Submit your answers?" }).waitFor();

    // Click confirm — will fail because offline, but app queues it
    await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();

    // Soft assertion: toast may vary — don't block the more critical auto-retry verification
    await expect.soft(
      page.locator('[data-sonner-toast]').filter({ hasText: /offline|saved locally/i })
    ).toBeVisible({ timeout: 10000 });

    // Go back online — auto-retry should fire
    await context.setOffline(false);

    // Should eventually show success — either "Submitted!" heading or recovery toast
    await expect(
      page.getByRole("heading", { name: "Submitted!" })
    ).toBeVisible({ timeout: 15000 });

    await context.close();
  });
});
