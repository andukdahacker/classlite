import { expect } from "@playwright/test";
import {
  submissionTest as test,
  startSubmissionAsStudent,
} from "../../fixtures/submission-fixtures";

test.describe("Question Type Rendering", () => {
  test("MCQ renders tap-friendly option buttons and selecting highlights", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Verify MCQ question text renders
    await expect(
      page.getByText("What is described as one of the most pressing issues")
    ).toBeVisible();

    // Verify all 4 options render
    await expect(page.getByText("A. Economic recession")).toBeVisible();
    await expect(page.getByText("B. Climate change")).toBeVisible();
    await expect(page.getByText("C. Political instability")).toBeVisible();
    await expect(page.getByText("D. Technological disruption")).toBeVisible();

    // Verify options are in tap-friendly labels (min-h-[44px])
    const optionLabels = page.locator("label").filter({ hasText: /^[A-D]\. / });
    const count = await optionLabels.count();
    expect(count).toBe(4);

    // Each option label should have min-h-[44px] class for touch targets
    for (let i = 0; i < count; i++) {
      await expect(optionLabels.nth(i)).toHaveClass(/min-h-\[44px\]/);
    }

    // Select option A — it should get highlighted
    await page.getByText("A. Economic recession").click();
    const optionA = page.locator("label").filter({ hasText: "A. Economic recession" });
    await expect(optionA).toHaveClass(/border-primary/);

    // Select option C — option A should un-highlight, C should highlight
    await page.getByText("C. Political instability").click();
    const optionC = page.locator("label").filter({ hasText: "C. Political instability" });
    await expect(optionC).toHaveClass(/border-primary/);
    await expect(optionA).not.toHaveClass(/border-primary/);

    await context.close();
  });

  test("text answer input renders, accepts text, and value persists after navigate", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Navigate to Q2 (text answer)
    await page.getByRole("button", { name: /Next/ }).click();

    // Verify text question renders
    await expect(
      page.getByText("What are rising global temperatures causing to melt?")
    ).toBeVisible();

    // Verify text input renders with placeholder
    const textInput = page.locator('input[placeholder="Type your answer..."]');
    await expect(textInput).toBeVisible();

    // Verify min-h-[44px] for touch target
    await expect(textInput).toHaveClass(/min-h-\[44px\]/);

    // Type answer
    await textInput.fill("ice caps");
    await expect(textInput).toHaveValue("ice caps");

    // Navigate away (Previous)
    await page.getByRole("button", { name: /Previous/ }).click();

    // Navigate back (Next)
    await page.getByRole("button", { name: /Next/ }).click();

    // Value should persist
    await expect(
      page.locator('input[placeholder="Type your answer..."]')
    ).toHaveValue("ice caps");

    await context.close();
  });

  test.fixme("writing input renders rich text area", async () => {
    // Requires WRITING exercise fixture — current test exercise is READING only.
    // WritingInput.tsx exists but has zero E2E coverage.
    // Create a dedicated WRITING fixture when writing E2E tests are needed.
  });
});
