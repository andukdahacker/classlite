import { test, expect, TEST_USERS } from "../../fixtures/auth.fixture";
import { loginAs } from "../../fixtures/auth.fixture";
import { waitForToast } from "../../utils/test-helpers";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";
import {
  uniqueName,
  gotoExercises,
  cleanupExercise,
} from "../../fixtures/exercise-fixtures";

/**
 * AC1: Exercise Builder Flow
 * E2E test covering: navigate to exercises page → create new exercise →
 * set skill type (Reading) → add a passage → add a question section (MCQ) →
 * add questions with answer options → mark correct answers → save exercise →
 * verify exercise appears in exercise list.
 */
test.describe("Exercise Builder Flow (AC1)", () => {
  let createdExerciseId: string | null = null;

  test.afterEach(async ({ page }) => {
    if (createdExerciseId) {
      await cleanupExercise(page, createdExerciseId);
      createdExerciseId = null;
    }
  });

  test("create Reading exercise with MCQ questions (R1)", async ({ page }) => {
    const exerciseTitle = uniqueName("E2E Reading MCQ");

    // Step 1: Login and navigate to exercises page
    await loginAs(page, TEST_USERS.OWNER);
    await gotoExercises(page);

    // Verify exercises page loaded
    await expect(
      page.getByRole("heading", { name: "Exercises" }).first()
    ).toBeVisible();

    // Step 2: Click "Create Exercise"
    await page.getByRole("button", { name: "Create Exercise" }).click();

    // Step 3: Select Reading skill
    await page
      .getByRole("heading", { name: "Select Exercise Skill" })
      .waitFor();
    await page
      .locator("button")
      .filter({ hasText: "Reading" })
      .first()
      .click();

    // Wait for exercise creation and redirect to editor
    await page.waitForURL(/.*\/exercises\/[^/]+\/edit/);
    await waitForToast(page, "Exercise created");

    // Wait for editor to fully load exercise data before filling fields
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);
    await expect(page.locator("#exercise-title")).not.toHaveValue("", {
      timeout: 5000,
    });

    // Extract exercise ID for cleanup
    const url = page.url();
    const match = url.match(/exercises\/([^/]+)\/edit/);
    createdExerciseId = match?.[1] ?? null;

    // Step 4: Fill exercise title
    await page.locator("#exercise-title").clear();
    await page.locator("#exercise-title").fill(exerciseTitle);

    // Step 5: Fill instructions
    await page
      .locator("#exercise-instructions")
      .fill("Read the passage and answer the questions below.");

    // Step 6: Add a passage
    const passageTextarea = page.locator("#passage-editor");
    await passageTextarea.fill(
      "The development of artificial intelligence has been one of the most " +
        "significant technological achievements of the 21st century. Machine learning " +
        "algorithms have enabled computers to perform tasks that were once thought to " +
        "be exclusively within the domain of human intelligence.\n\n" +
        "Natural language processing, a subfield of AI, has made remarkable progress in " +
        "recent years. Systems like large language models can now generate human-like text, " +
        "translate between languages, and answer complex questions with impressive accuracy."
    );

    // Step 7: Ensure a question section exists (auto-created or add one)
    const sectionHeading = page.getByText(/Section 1/).first();
    const addSectionBtn = page.getByRole("button", { name: /Add Section/i });
    const hasSectionAlready = await sectionHeading.isVisible().catch(() => false);
    if (!hasSectionAlready && await addSectionBtn.isVisible().catch(() => false)) {
      await addSectionBtn.click();
    }
    await expect(sectionHeading).toBeVisible({ timeout: 10000 });

    // Step 8: Add a question — use the inline input + "Add" button
    const questionInput = page.getByPlaceholder(/Type a question/i).first();
    await expect(questionInput).toBeVisible({ timeout: 10000 });
    await questionInput.fill(
      "What is described as one of the most significant technological achievements?"
    );
    await page
      .locator("button")
      .filter({ hasText: /^Add$/ })
      .first()
      .click();

    // Add answer options — option inputs must be visible after adding a question
    const optionInputs = page.locator(
      'input[placeholder*="Option"], input[placeholder*="option"], input[placeholder*="Answer"], input[placeholder*="answer"]'
    );
    await expect(optionInputs.first()).toBeVisible({ timeout: 10000 });
    const optionCount = await optionInputs.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);

    await optionInputs.nth(0).fill("Artificial intelligence");
    await optionInputs.nth(1).fill("Social media");
    if (optionCount >= 3) {
      await optionInputs.nth(2).fill("Electric vehicles");
    }
    if (optionCount >= 4) {
      await optionInputs.nth(3).fill("Space exploration");
    }

    // Mark correct answer — radio/checkbox must be present
    const correctMarker = page
      .locator(
        '[data-testid="correct-answer"], input[type="radio"], [role="radio"]'
      )
      .first();
    await expect(correctMarker).toBeVisible({ timeout: 5000 });
    await correctMarker.click();

    // Step 9: Save exercise
    await page.getByRole("button", { name: "Save Draft" }).click();
    await waitForToast(page, "Draft saved");

    // Step 10: Navigate back to exercise list
    await gotoExercises(page);

    // Step 11: Verify exercise appears in the exercise list
    await page
      .getByRole("heading", { name: "Exercises" })
      .first()
      .waitFor();
    await expect(page.getByText(exerciseTitle)).toBeVisible({ timeout: 10000 });
  });
});
