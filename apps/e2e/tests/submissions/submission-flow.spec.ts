import { expect } from "@playwright/test";
import { TEST_USERS, loginAs, E2E_CENTER_ID } from "../../fixtures/auth.fixture";
import {
  submissionTest as test,
  startSubmissionAsStudent,
  startSubmissionFromDashboard,
} from "../../fixtures/submission-fixtures";

test.describe("Submission Flow", () => {
  test("student opens assignment from dashboard and submission starts", async ({
    browser,
    testIds: _testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionFromDashboard(page);

    // Verify questions rendered — first question (MCQ) should show question text
    await expect(
      page.getByText("What is described as one of the most pressing issues")
    ).toBeVisible();

    await context.close();
  });

  test("student answers MCQ, navigates Next, answers text, navigates Previous — MCQ persists", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Q1: MCQ — select option B (Climate change)
    await page.getByText("B. Climate change").click();

    // Verify selection is highlighted (has bg-primary/10 class via border-primary)
    const selectedOption = page.locator("label").filter({ hasText: "B. Climate change" });
    await expect(selectedOption).toHaveClass(/border-primary/);

    // Click Next
    await page.getByRole("button", { name: /Next/ }).click();

    // Q2: Text answer — type answer
    const textInput = page.locator('input[placeholder="Type your answer..."]');
    await expect(textInput).toBeVisible();
    await textInput.fill("ice caps");

    // Click Previous
    await page.getByRole("button", { name: /Previous/ }).click();

    // Verify MCQ answer persists — option B still highlighted
    await expect(selectedOption).toHaveClass(/border-primary/);

    await context.close();
  });

  test("student submits — confirm dialog shows answered count — success page renders", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Answer both questions
    // Q1: MCQ
    await page.getByText("B. Climate change").click();

    // Navigate to Q2
    await page.getByRole("button", { name: /Next/ }).click();

    // Q2: Text
    await page.locator('input[placeholder="Type your answer..."]').fill("ice caps");

    // Click Submit (visible on last question)
    await page.getByRole("button", { name: "Submit" }).click();

    // SubmitConfirmDialog shows
    await expect(
      page.getByRole("heading", { name: "Submit your answers?" })
    ).toBeVisible();

    // Shows "all 2 questions" since both are answered
    await expect(
      page.getByText("You have answered all 2 questions")
    ).toBeVisible();

    // Confirm submission
    await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();

    // Success page renders
    await expect(
      page.getByRole("heading", { name: "Submitted!" })
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("submit dialog shows unanswered count when not all questions answered", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Answer only Q1 (MCQ)
    await page.getByText("B. Climate change").click();

    // Navigate to Q2 (text) but don't answer
    await page.getByRole("button", { name: /Next/ }).click();

    // Click Submit
    await page.getByRole("button", { name: "Submit" }).click();

    // Dialog shows 1 of 2 answered
    await expect(
      page.getByText("You have answered 1 of 2 questions")
    ).toBeVisible();

    // Shows unanswered warning
    await expect(page.getByText("1 question unanswered")).toBeVisible();

    // Cancel submission
    await page.getByRole("button", { name: "Go Back" }).click();

    // Dialog closes
    await expect(
      page.getByRole("heading", { name: "Submit your answers?" })
    ).not.toBeVisible();

    await context.close();
  });

  test("success page Back to Dashboard navigates to dashboard", async ({
    browser,
    testIds,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await startSubmissionAsStudent(page, testIds.assignmentId);

    // Answer Q1
    await page.getByText("B. Climate change").click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.locator('input[placeholder="Type your answer..."]').fill("ice caps");

    // Submit
    await page.getByRole("button", { name: "Submit" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();
    await expect(
      page.getByRole("heading", { name: "Submitted!" })
    ).toBeVisible({ timeout: 10000 });

    // Click "Back to Dashboard"
    await page.getByRole("button", { name: "Back to Dashboard" }).click();

    // Verify navigation to dashboard
    await page.waitForURL(new RegExp(`/${E2E_CENTER_ID}/dashboard`));

    await context.close();
  });

  test("non-student role cannot access submission page", async ({ browser, testIds }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as TEACHER (non-student)
    await loginAs(page, TEST_USERS.TEACHER);

    // Try to navigate to submission page
    await page.goto(
      `/${E2E_CENTER_ID}/assignments/${testIds.assignmentId}/take`
    );

    // Should be redirected away or show error — not render the submission page
    // The ProtectedRoute with allowedRoles={["STUDENT"]} should redirect
    await expect(
      page.getByText("What is described as one of the most pressing issues")
    ).not.toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
