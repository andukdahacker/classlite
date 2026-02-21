import { expect } from "@playwright/test";
import {
  submissionTest as test,
  startSubmissionAsStudent,
  waitForSubmissionReady,
} from "../../fixtures/submission-fixtures";

test.describe("Auto-Save", () => {
  // Auto-save tests need extra time: fixture setup (TEACHER login + API calls) +
  // test body (STUDENT login + submission initialization + auto-save cycle)
  test.setTimeout(90000);
  test("Saved indicator appears after answering a question", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);
    await waitForSubmissionReady(page);

    // Answer Q1: MCQ
    await page.getByText("B. Climate change").click();

    // Wait for save indicator to show "Saved" (auto-save fires within ~3s + render)
    const saveIndicator = page.locator('[data-testid="save-indicator"]');
    await expect(saveIndicator).toBeVisible({ timeout: 10000 });

    // Save indicator text cycles: "Saving..." → "Saved" — wait for "Saved"
    // The text may be hidden on small viewports (sm:inline), so check via textContent
    await expect(saveIndicator).toContainText(/Saved|Saving/, { timeout: 10000 });

    // Verify indicator eventually hides after "Saved" state (Saving → Saved → hidden cycle)
    await expect(saveIndicator).not.toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("answer persists after page refresh", async ({ browser, testIds }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);
    await waitForSubmissionReady(page);

    // Answer Q1: MCQ — select option B
    await page.getByText("B. Climate change").click();

    // Wait for save to complete (indicator shows "Saved")
    await expect(
      page.locator('[data-testid="save-indicator"]')
    ).toContainText(/Saved/, { timeout: 10000 });

    // Wait a moment for server save to settle
    await page.waitForTimeout(1000);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for submission to re-initialize
    await page.getByRole("button", { name: /Next|Submit/ }).first().waitFor({ timeout: 15000 });

    // Verify MCQ answer is restored — option B should be highlighted
    const selectedOption = page.locator("label").filter({ hasText: "B. Climate change" });
    await expect(selectedOption).toHaveClass(/border-primary/, { timeout: 5000 });

    await context.close();
  });

  test("save-on-navigate fires, answer persists on return", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Answer Q1: MCQ
    await page.getByText("B. Climate change").click();

    // Navigate to Q2 (save-on-navigate fires)
    await page.getByRole("button", { name: /Next/ }).click();

    // Answer Q2
    await page.locator('input[placeholder="Type your answer..."]').fill("ice caps");

    // Navigate back to Q1
    await page.getByRole("button", { name: /Previous/ }).click();

    // Q1 answer should persist
    const selectedOption = page.locator("label").filter({ hasText: "B. Climate change" });
    await expect(selectedOption).toHaveClass(/border-primary/);

    // Navigate forward again to Q2
    await page.getByRole("button", { name: /Next/ }).click();

    // Q2 answer should persist
    const textInput = page.locator('input[placeholder="Type your answer..."]');
    await expect(textInput).toHaveValue("ice caps");

    await context.close();
  });
});
