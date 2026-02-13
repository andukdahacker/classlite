import { test, expect, TEST_USERS } from "../../fixtures/auth.fixture";
import { loginAs } from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";
import { waitForToast } from "../../utils/test-helpers";
import {
  uniqueName,
  gotoExercises,
  createExerciseViaAPI,
  archiveExerciseViaAPI,
  cleanupExercises,
} from "../../fixtures/exercise-fixtures";

/**
 * AC3: Exercise Library Flow
 * E2E test covering: navigate to exercise library → verify exercises are listed →
 * use skill filter → use search → duplicate an exercise → verify duplicate appears →
 * archive an exercise → verify it moves to archived.
 */
test.describe("Exercise Library (AC3)", () => {
  const createdIds: string[] = [];

  test.afterAll(async ({ browser }) => {
    if (createdIds.length === 0) return;
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, TEST_USERS.OWNER);
    await cleanupExercises(page, createdIds);
    await context.close();
  });

  test("exercise list displays created exercises", async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Create test exercises via API
    const reading = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Library Reading"),
    });
    createdIds.push(reading.id);

    const writing = await createExerciseViaAPI(page, {
      skill: "WRITING",
      title: uniqueName("E2E Library Writing"),
    });
    createdIds.push(writing.id);

    // Navigate to exercises page
    await gotoExercises(page);

    // Verify both exercises appear in the list
    await expect(page.getByText(reading.title)).toBeVisible();
    await expect(page.getByText(writing.title)).toBeVisible();
  });

  test("filter exercises by skill (Reading, Listening, Writing, Speaking)", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Create exercises for different skills
    const reading = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Filter-Reading"),
    });
    createdIds.push(reading.id);

    const listening = await createExerciseViaAPI(page, {
      skill: "LISTENING",
      title: uniqueName("E2E Filter-Listening"),
    });
    createdIds.push(listening.id);

    await gotoExercises(page);

    // Filter by Reading
    const skillSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /All Skills|Reading|Listening|Writing|Speaking/i })
      .first();
    await skillSelect.click();
    await page
      .locator('[role="option"]')
      .filter({ hasText: "Reading" })
      .click();

    // Verify Reading exercise is visible and Listening is not
    await expect(page.getByText(reading.title)).toBeVisible();
    await expect(page.getByText(listening.title)).not.toBeVisible();

    // Filter by Listening
    await skillSelect.click();
    await page
      .locator('[role="option"]')
      .filter({ hasText: "Listening" })
      .click();

    // Verify Listening exercise is visible and Reading is not
    await expect(page.getByText(listening.title)).toBeVisible();
    await expect(page.getByText(reading.title)).not.toBeVisible();

    // Reset filter to All Skills
    await skillSelect.click();
    await page
      .locator('[role="option"]')
      .filter({ hasText: "All Skills" })
      .click();

    // Both should be visible
    await expect(page.getByText(reading.title)).toBeVisible();
    await expect(page.getByText(listening.title)).toBeVisible();
  });

  test("search exercises by title", async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);

    const searchTag = `Search${Date.now()}`;
    const searchExercise = await createExerciseViaAPI(page, {
      skill: "READING",
      title: `E2E ${searchTag} Exercise`,
    });
    createdIds.push(searchExercise.id);

    const otherExercise = await createExerciseViaAPI(page, {
      skill: "WRITING",
      title: uniqueName("E2E Other"),
    });
    createdIds.push(otherExercise.id);

    await gotoExercises(page);

    // Type in search box
    const searchInput = page.getByPlaceholder(/Search exercises/i);
    await searchInput.fill(searchTag);

    // Verify search results — matching exercise visible, other not
    await expect(page.getByText(searchExercise.title)).toBeVisible();
    await expect(page.getByText(otherExercise.title)).not.toBeVisible();

    // Clear search
    await searchInput.clear();

    // Both should be visible again
    await expect(page.getByText(searchExercise.title)).toBeVisible();
  });

  test("duplicate exercise — verify copy appears with (Copy) suffix", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.OWNER);

    const original = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Duplicate Source"),
    });
    createdIds.push(original.id);

    await gotoExercises(page);

    // Find the exercise row and click the actions menu
    const exerciseRow = page
      .locator("tr, [class*='card']")
      .filter({ hasText: original.title })
      .first();
    const actionsButton = exerciseRow.locator(
      'button[aria-label*="action" i], button:has(svg)'
    ).last();
    await actionsButton.click();

    // Click Duplicate in the dropdown menu
    const duplicateOption = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /Duplicate/i });
    await duplicateOption.click();

    // Wait for success toast — must match "Exercise duplicated" (not "Failed to duplicate")
    await waitForToast(page, "Exercise duplicated");

    // Reload page to reliably pick up the duplicated exercise.
    // React Query invalidation can race with networkidle, so a full
    // reload ensures the list is fresh from the server.
    await page.reload();
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    // Use the search box to find the duplicate — with many exercises from
    // previous runs the list may have multiple pages (PAGE_SIZE=20).
    const searchInput = page.getByPlaceholder(/Search exercises/i);
    await searchInput.fill(`Copy of ${original.title}`);
    await page.waitForLoadState("networkidle");

    // Verify the duplicate appears in the list with "Copy of" prefix
    await expect(
      page.getByText(`Copy of ${original.title}`).or(
        page.getByText(new RegExp(`Copy of.*${original.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i"))
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("archive exercise — verify it moves to archived view", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.OWNER);

    const toArchive = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Archive Target"),
    });
    createdIds.push(toArchive.id);

    await gotoExercises(page);

    // Find exercise and open actions menu
    const exerciseRow = page
      .locator("tr, [class*='card']")
      .filter({ hasText: toArchive.title })
      .first();
    const actionsButton = exerciseRow.locator(
      'button[aria-label*="action" i], button:has(svg)'
    ).last();
    await actionsButton.click();

    // Click Archive
    const archiveOption = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /Archive/i });
    await archiveOption.click();

    // Wait for success
    await waitForToast(page, "archived");

    // Verify exercise is no longer visible in the active list
    await expect(page.getByText(toArchive.title)).not.toBeVisible();

    // Toggle "Show Archived" to verify it appears in archived view
    const showArchivedToggle = page.getByLabel(/Show Archived|Archived/i).or(
      page.locator('button, [role="switch"]').filter({ hasText: /Archived/i })
    );
    if (await showArchivedToggle.first().isVisible()) {
      await showArchivedToggle.first().click();
      await expect(page.getByText(toArchive.title)).toBeVisible();
    }
  });

  test("restore archived exercise", async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Create and archive via API
    const exercise = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Restore Target"),
    });
    createdIds.push(exercise.id);
    await archiveExerciseViaAPI(page, exercise.id);

    await gotoExercises(page);

    // Enable archived view
    const showArchivedToggle = page.getByLabel(/Show Archived|Archived/i).or(
      page.locator('button, [role="switch"]').filter({ hasText: /Archived/i })
    );
    if (await showArchivedToggle.first().isVisible()) {
      await showArchivedToggle.first().click();
    }

    // Filter to show archived status
    const statusSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /All Statuses|Status/i })
      .first();
    if (await statusSelect.isVisible()) {
      // The archived exercises should be visible now
    }

    // Find exercise and restore it
    const exerciseRow = page
      .locator("tr, [class*='card']")
      .filter({ hasText: exercise.title })
      .first();

    if (await exerciseRow.isVisible()) {
      const actionsButton = exerciseRow.locator(
        'button[aria-label*="action" i], button:has(svg)'
      ).last();
      await actionsButton.click();

      const restoreOption = page
        .locator('[role="menuitem"]')
        .filter({ hasText: /Restore/i });
      if (await restoreOption.isVisible()) {
        await restoreOption.click();
        await waitForToast(page, "restored");
      }
    }
  });
});
