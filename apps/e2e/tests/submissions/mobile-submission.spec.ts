import { expect } from "@playwright/test";
import {
  submissionTest as test,
  startSubmissionAsStudent,
} from "../../fixtures/submission-fixtures";

test.describe("Mobile Viewport Submission", () => {
  test("no horizontal scrollbar at 375px viewport", async ({ browser, testIds }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 812 });

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Check no horizontal overflow
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);

    // Navigate to Q2 and check again
    await page.getByRole("button", { name: /Next/ }).click();
    const hasHorizontalScrollQ2 = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScrollQ2).toBe(false);

    await context.close();
  });

  test("Previous/Next buttons are visible and have 44px+ touch targets at 375px", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 812 });

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // On Q1 (first question), Previous is disabled but visible, Next is enabled
    const nextButton = page.getByRole("button", { name: /Next/ });
    await expect(nextButton).toBeVisible();

    // Check min-height of Next button (44px touch target)
    const nextBox = await nextButton.boundingBox();
    expect(nextBox).not.toBeNull();
    expect(nextBox!.height).toBeGreaterThanOrEqual(44);

    // Navigate to Q2
    await nextButton.click();

    // On Q2 (last question), Previous is visible, Submit button appears instead of Next
    const previousButton = page.getByRole("button", { name: /Previous/ });
    await expect(previousButton).toBeVisible();

    const previousBox = await previousButton.boundingBox();
    expect(previousBox).not.toBeNull();
    expect(previousBox!.height).toBeGreaterThanOrEqual(44);

    await context.close();
  });

  test("submit button is accessible and tappable at 375px viewport", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 812 });

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Answer Q1
    await page.getByText("B. Climate change").click();

    // Navigate to last question
    await page.getByRole("button", { name: /Next/ }).click();

    // Submit button should be visible on last question
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeVisible();

    // Check touch target size
    const submitBox = await submitButton.boundingBox();
    expect(submitBox).not.toBeNull();
    expect(submitBox!.height).toBeGreaterThanOrEqual(44);

    // Tap submit — dialog should open
    await submitButton.click();
    await expect(
      page.getByRole("heading", { name: "Submit your answers?" })
    ).toBeVisible();

    await context.close();
  });

  test("complete submission flow at 375px mobile viewport", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 812 });

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Answer Q1: MCQ
    await page.getByText("B. Climate change").click();

    // Navigate to Q2
    await page.getByRole("button", { name: /Next/ }).click();

    // Answer Q2: text
    await page.locator('input[placeholder="Type your answer..."]').fill("ice caps");

    // Submit
    await page.getByRole("button", { name: "Submit" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();

    // Success
    await expect(
      page.getByRole("heading", { name: "Submitted!" })
    ).toBeVisible({ timeout: 10000 });

    // Back to Dashboard button tappable
    const dashButton = page.getByRole("button", { name: "Back to Dashboard" });
    await expect(dashButton).toBeVisible();
    const dashBox = await dashButton.boundingBox();
    expect(dashBox).not.toBeNull();
    expect(dashBox!.height).toBeGreaterThanOrEqual(44);

    await context.close();
  });
});
