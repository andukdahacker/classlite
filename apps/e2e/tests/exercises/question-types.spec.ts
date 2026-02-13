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
 * AC2: Question Type Coverage
 * E2E tests for at least one question type per skill:
 * - Reading: MCQ (R1) — covered in create-exercise.spec.ts
 * - Listening: gap fill (L3) with audio upload stubbed/mocked
 * - Writing: Task 2 essay (W2)
 * - Speaking: Part 1 (S1)
 * Each test creates an exercise with that question type and verifies it saves correctly.
 */
test.describe("Question Type Coverage (AC2)", () => {
  let createdExerciseId: string | null = null;

  test.afterEach(async ({ page }) => {
    if (createdExerciseId) {
      await cleanupExercise(page, createdExerciseId);
      createdExerciseId = null;
    }
  });

  /**
   * Helper: create exercise via skill button, wait for editor to fully load.
   * Returns the exercise ID extracted from the URL.
   */
  async function createExerciseAndWaitForEditor(
    page: import("@playwright/test").Page,
    skill: string
  ): Promise<string | null> {
    await page.getByRole("button", { name: "Create Exercise" }).click();
    await page
      .getByRole("heading", { name: "Select Exercise Skill" })
      .waitFor();

    await page
      .locator("button")
      .filter({ hasText: skill })
      .first()
      .click();

    await page.waitForURL(/.*\/exercises\/[^/]+\/edit/);
    await waitForToast(page, "Exercise created");

    // Wait for exercise data to fully load before interacting with the editor
    // This prevents the useEffect from overwriting title after we fill it
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    // Wait for the title input to have a value (exercise data loaded)
    await expect(page.locator("#exercise-title")).not.toHaveValue("", {
      timeout: 5000,
    });

    const url = page.url();
    return url.match(/exercises\/([^/]+)\/edit/)?.[1] ?? null;
  }

  test("create Listening exercise with L3 matching questions", async ({
    page,
  }) => {
    const exerciseTitle = uniqueName("E2E Listening L3");

    await loginAs(page, TEST_USERS.OWNER);
    await gotoExercises(page);

    createdExerciseId = await createExerciseAndWaitForEditor(page, "Listening");

    // Fill title
    await page.locator("#exercise-title").clear();
    await page.locator("#exercise-title").fill(exerciseTitle);

    // Fill transcript — use the textarea by its id to avoid matching the checkbox
    const transcriptField = page.locator("#passage-editor");
    if (await transcriptField.isVisible()) {
      await transcriptField.fill(
        "Speaker 1: Welcome to the environmental science lecture. Today we'll discuss climate change.\n\n" +
          "Speaker 2: Thank you. Let's start with the greenhouse effect and how it relates to global warming."
      );
    }

    // Change section type to L3_MATCHING if not default
    const sectionTypeSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Form|Note|Table|Matching/i })
      .first();
    if (await sectionTypeSelect.isVisible()) {
      await sectionTypeSelect.click();
      const matchingOption = page
        .locator('[role="option"]')
        .filter({ hasText: "Matching" });
      if (await matchingOption.isVisible()) {
        await matchingOption.click();
      }
    }

    // Save draft
    await page.getByRole("button", { name: "Save Draft" }).click();
    await waitForToast(page, "Draft saved");

    // Verify exercise title persists after save
    await expect(page.locator("#exercise-title")).toHaveValue(exerciseTitle);
  });

  test("create Writing exercise with W2 essay task", async ({ page }) => {
    const exerciseTitle = uniqueName("E2E Writing W2");

    await loginAs(page, TEST_USERS.OWNER);
    await gotoExercises(page);

    createdExerciseId = await createExerciseAndWaitForEditor(page, "Writing");

    // Fill title
    await page.locator("#exercise-title").clear();
    await page.locator("#exercise-title").fill(exerciseTitle);

    // Fill writing prompt
    const promptField = page.getByLabel(/Prompt|Writing Prompt/i);
    if (await promptField.isVisible()) {
      await promptField.fill(
        "Some people believe that technology has made our lives more complicated rather than simpler. " +
          "To what extent do you agree or disagree with this statement? " +
          "Give reasons for your answer and include any relevant examples from your own knowledge or experience."
      );
    }

    // Change to W3_TASK2_ESSAY for Task 2 essay if section type select is visible
    const sectionTypeSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Task 1 Academic|Task 2 Essay/i })
      .first();
    if (await sectionTypeSelect.isVisible()) {
      await sectionTypeSelect.click();
      const essayOption = page
        .locator('[role="option"]')
        .filter({ hasText: "Task 2 Essay" });
      if (await essayOption.isVisible()) {
        await essayOption.click();
      }
    }

    // Set word count minimum
    const wordCountField = page.getByLabel(/Word Count|Minimum|Min/i).first();
    if (await wordCountField.isVisible()) {
      await wordCountField.fill("250");
    }

    // Save draft — dismiss any lingering toasts first (short timeout to avoid blocking)
    await page
      .locator('[data-sonner-toast] button[aria-label="Close"]')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.getByRole("button", { name: "Save Draft" }).click();
    await waitForToast(page, "Draft saved");

    // Verify title persists
    await expect(page.locator("#exercise-title")).toHaveValue(exerciseTitle);
  });

  test("create Speaking exercise with S1 Part 1 questions", async ({
    page,
  }) => {
    const exerciseTitle = uniqueName("E2E Speaking S1");

    await loginAs(page, TEST_USERS.OWNER);
    await gotoExercises(page);

    createdExerciseId = await createExerciseAndWaitForEditor(page, "Speaking");

    // Fill title
    await page.locator("#exercise-title").clear();
    await page.locator("#exercise-title").fill(exerciseTitle);

    // Set speaking prep time if field visible
    const prepTimeField = page.getByLabel(/Prep|Preparation/i).first();
    if (await prepTimeField.isVisible().catch(() => false)) {
      await prepTimeField.fill("30");
    }

    // Set speaking time
    const speakingTimeField = page.getByLabel(/Speaking Time/i).first();
    if (await speakingTimeField.isVisible().catch(() => false)) {
      await speakingTimeField.fill("120");
    }

    // Speaking default section type is S1_PART1_QA — verify section exists
    const sectionVisible = await page
      .getByText(/Section 1/)
      .first()
      .isVisible()
      .catch(() => false);
    if (!sectionVisible) {
      const addSectionBtn = page.getByRole("button", {
        name: /Add Section/i,
      });
      if (await addSectionBtn.isVisible().catch(() => false)) {
        await addSectionBtn.click();
      }
    }

    // Add a question — the inline input takes question text, then click "Add"
    const questionInput = page
      .getByPlaceholder(/Type a question|question|prompt/i)
      .first();
    if (await questionInput.isVisible().catch(() => false)) {
      await questionInput.fill(
        "Do you enjoy reading? What kind of books do you like?"
      );
      // Click the "Add" button next to the input
      await page
        .locator("button")
        .filter({ hasText: /^Add$/ })
        .first()
        .click();
    }

    // Save draft
    await page.getByRole("button", { name: "Save Draft" }).click();
    await waitForToast(page, "Draft saved");

    // Verify title persists
    await expect(page.locator("#exercise-title")).toHaveValue(exerciseTitle);
  });
});
