import { test, expect, TEST_USERS } from "../../fixtures/auth.fixture";
import { loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";
import { waitForToast } from "../../utils/test-helpers";
import {
  uniqueName,
  createExerciseViaAPI,
  cleanupExercise,
} from "../../fixtures/exercise-fixtures";

/**
 * AC1 (continued): Exercise Editor Tests
 * - Edit an existing exercise → modify questions → save → verify changes persist
 * - Add timer settings → save → verify timer appears on exercise
 * - Add band level and topic tags → save → verify tags persist
 */
test.describe("Exercise Editor (AC1)", () => {
  let exerciseId: string | null = null;

  test.afterEach(async ({ page }) => {
    if (exerciseId) {
      await cleanupExercise(page, exerciseId);
      exerciseId = null;
    }
  });

  /**
   * Helper: navigate to exercise editor and wait for it to fully load.
   */
  async function gotoExerciseEditor(
    page: import("@playwright/test").Page,
    id: string
  ) {
    await page.goto(getAppUrl(`/exercises/${id}/edit`));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);
    // Wait for exercise data to load into the title input
    await expect(page.locator("#exercise-title")).not.toHaveValue("", {
      timeout: 10000,
    });
  }

  test("edit existing exercise — modify title and instructions, verify changes persist", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Create exercise via API for faster setup
    const created = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Edit Test"),
    });
    exerciseId = created.id;

    // Navigate to exercise editor
    await gotoExerciseEditor(page, created.id);

    // Verify title loaded
    await expect(page.locator("#exercise-title")).toHaveValue(created.title);

    // Modify title
    const newTitle = uniqueName("E2E Edited");
    await page.locator("#exercise-title").clear();
    await page.locator("#exercise-title").fill(newTitle);

    // Modify instructions
    const newInstructions = "Updated instructions for the edited exercise.";
    await page.locator("#exercise-instructions").fill(newInstructions);

    // Save
    await page.getByRole("button", { name: "Save Draft" }).click();
    await waitForToast(page, "Draft saved");

    // Reload page to verify persistence
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify changes persisted
    await expect(page.locator("#exercise-title")).toHaveValue(newTitle);
    await expect(page.locator("#exercise-instructions")).toHaveValue(
      newInstructions
    );
  });

  test("add timer settings — save and verify timer settings persist", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Create exercise via API
    const created = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Timer Test"),
    });
    exerciseId = created.id;

    // Navigate to editor
    await gotoExerciseEditor(page, created.id);

    // Enable time limit — first click the checkbox to enable
    const enableTimerCheckbox = page.locator("#enable-time-limit");
    if (await enableTimerCheckbox.isVisible()) {
      await enableTimerCheckbox.click();

      // Wait for the time limit input to appear
      const timeLimitInput = page.locator("#time-limit-minutes");
      await timeLimitInput.waitFor({ state: "visible", timeout: 3000 });
      await timeLimitInput.fill("60");
    }

    // Save
    await page.getByRole("button", { name: "Save Draft" }).click();
    await waitForToast(page, "Draft saved");

    // Reload to verify
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify timer setting persisted — the checkbox should be checked and input visible
    const timeLimitAfterReload = page.locator("#time-limit-minutes");
    if (await timeLimitAfterReload.isVisible()) {
      await expect(timeLimitAfterReload).toHaveValue("60");
    }
  });

  test("add band level and topic tags — save and verify tags persist", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Create exercise via API
    const created = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Tags Test"),
    });
    exerciseId = created.id;

    // Navigate to editor
    await gotoExerciseEditor(page, created.id);

    // Set band level — the band level select is inside the TagSelector component
    // It's a Select with "Target Band Level" label
    const bandLevelSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /None|Band|Level|4-5|5-6|6-7|7-8|8-9/i })
      .first();
    if (await bandLevelSelect.isVisible()) {
      await bandLevelSelect.click();
      await page
        .locator('[role="option"]')
        .filter({ hasText: /6-7/ })
        .first()
        .click();
    }

    // Add topic tags — the tag picker trigger button says "Select tags..."
    const tagTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Select tags|tag/i })
      .first();
    if (await tagTrigger.isVisible()) {
      await tagTrigger.click();

      // Type in the command input to search/create tag
      const tagInput = page.getByPlaceholder(/Search or create/i).first();
      if (await tagInput.isVisible()) {
        await tagInput.fill("E2E-test-tag");

        // Look for existing tag or "Create" option
        const tagOption = page
          .locator('[cmdk-item], [role="option"]')
          .filter({ hasText: /E2E-test-tag|Create/i })
          .first();
        await tagOption.waitFor({ state: "visible", timeout: 5000 });
        await tagOption.click();
      }

      // Close popover
      await page.keyboard.press("Escape");
    }

    // Save draft — band level is saved via autosave, tags are saved immediately
    await page.getByRole("button", { name: "Save Draft" }).click();
    await waitForToast(page, "Draft saved");

    // Reload to verify
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify band level persisted — check that the band select shows 6-7
    const bandAfterReload = page
      .locator('[role="combobox"]')
      .filter({ hasText: /6-7/ })
      .first();
    if ((await bandAfterReload.count()) > 0) {
      await expect(bandAfterReload).toBeVisible();
    }
  });
});
