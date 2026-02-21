import { test, expect, TEST_USERS } from "../../fixtures/auth.fixture";
import { loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";
import { waitForToast } from "../../utils/test-helpers";
import {
  uniqueName,
  gotoExercises,
  createExerciseViaAPI,
  cleanupExercise,
} from "../../fixtures/exercise-fixtures";

/**
 * AC6: Tag Management Flow
 * E2E test covering: navigate to settings → tags page → create a new topic tag →
 * assign tag to an exercise → filter exercises by tag → verify filtered results.
 */
test.describe("Tag Management Flow (AC6)", () => {
  let exerciseId: string | null = null;

  test.afterEach(async ({ page }) => {
    if (exerciseId) {
      await cleanupExercise(page, exerciseId);
      exerciseId = null;
    }
  });

  /**
   * Helper to navigate to tags settings page.
   */
  async function gotoTagsSettings(page: import("@playwright/test").Page) {
    await page.goto(getAppUrl("/settings/tags"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);
    await page.getByText("Topic Tags").first().waitFor();
  }

  /**
   * Find a specific tag row within the tag list.
   * Uses the divide-y container to scope the search to tag rows only.
   */
  function getTagRow(page: import("@playwright/test").Page, tagName: string) {
    return page
      .locator(".divide-y > div")
      .filter({ hasText: tagName });
  }

  test("create a new topic tag", async ({ page }) => {
    const tagName = uniqueName("E2E Tag");

    await loginAs(page, TEST_USERS.OWNER);
    await gotoTagsSettings(page);

    // Fill the new tag input
    await page
      .getByPlaceholder(/New tag name/i)
      .fill(tagName);

    // Click "Add Tag" button
    await page.getByRole("button", { name: /Add Tag/i }).click();

    // Verify success toast
    await waitForToast(page, "Tag created");

    // Verify tag appears in the list
    await expect(page.getByText(tagName)).toBeVisible();
  });

  test("rename a tag — verify updated name appears", async ({ page }) => {
    const originalName = uniqueName("E2E Rename-Original");
    const newName = uniqueName("E2E Rename-Updated");

    await loginAs(page, TEST_USERS.OWNER);
    await gotoTagsSettings(page);

    // Create a tag first
    await page.getByPlaceholder(/New tag name/i).fill(originalName);
    await page.getByRole("button", { name: /Add Tag/i }).click();
    await waitForToast(page, "Tag created");

    // Find the specific tag row and click the rename button
    const tagRow = getTagRow(page, originalName);
    await tagRow.locator('button[title="Rename"]').click();

    // The input that appears when editing inline
    const inlineInput = page.locator("input[autofocus], input:focus").first();
    await inlineInput.clear();
    await inlineInput.fill(newName);

    // Confirm the edit (press Enter or click check button)
    await inlineInput.press("Enter");

    // Verify success
    await waitForToast(page, "Tag updated");
    await expect(page.getByText(newName)).toBeVisible();
  });

  test("delete a tag — verify removed from list", async ({ page }) => {
    const tagName = uniqueName("E2E Delete-Tag");

    await loginAs(page, TEST_USERS.OWNER);
    await gotoTagsSettings(page);

    // Create tag
    await page.getByPlaceholder(/New tag name/i).fill(tagName);
    await page.getByRole("button", { name: /Add Tag/i }).click();
    await waitForToast(page, "Tag created");
    await expect(page.getByText(tagName)).toBeVisible();

    // Find the specific tag row and click delete button
    const tagRow = getTagRow(page, tagName);
    await tagRow.locator('button[title="Delete"]').click();

    // Confirm deletion in the alert dialog
    const confirmDialog = page.getByRole("alertdialog");
    await confirmDialog.waitFor();
    await confirmDialog.getByRole("button", { name: /Delete/i }).click();

    // Verify success
    await waitForToast(page, "Tag deleted");

    // Wait for the confirmation dialog to fully close (it contains the tag name
    // in its description, causing strict mode violations if still in the DOM)
    await expect(confirmDialog).not.toBeVisible({ timeout: 5000 });

    // Verify tag is no longer visible in the list
    await expect(getTagRow(page, tagName)).not.toBeVisible();
  });

  test("assign tag to exercise via exercise editor", async ({ page }) => {
    const tagName = uniqueName("E2E Assign-Tag");

    await loginAs(page, TEST_USERS.OWNER);

    // First create the tag
    await gotoTagsSettings(page);
    await page.getByPlaceholder(/New tag name/i).fill(tagName);
    await page.getByRole("button", { name: /Add Tag/i }).click();
    await waitForToast(page, "Tag created");

    // Create an exercise via API
    const exercise = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Tag-Exercise"),
    });
    exerciseId = exercise.id;

    // Navigate to exercise editor
    await page.goto(getAppUrl(`/exercises/${exercise.id}/edit`));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    // Wait for exercise data to load
    await expect(page.locator("#exercise-title")).not.toHaveValue("", {
      timeout: 10000,
    });

    // Open the tag selector — it's a Popover trigger button with role="combobox"
    // Text says "Select tags..." or "N tag(s) selected"
    const tagTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Select tags|tag/i })
      .first();
    await tagTrigger.waitFor({ state: "visible", timeout: 10000 });
    await tagTrigger.click();

    // Search for the tag using the Command input.
    // Use pressSequentially to properly trigger cmdk's internal search/filter.
    const tagSearchInput = page
      .getByPlaceholder(/Search or create/i)
      .first();
    await tagSearchInput.waitFor({ state: "visible", timeout: 5000 });
    await tagSearchInput.pressSequentially(tagName, { delay: 20 });

    // Wait for cmdk to filter and auto-highlight the matching item
    const tagItem = page
      .locator('[cmdk-item], [data-slot="command-item"]')
      .filter({ hasText: tagName })
      .first();
    await tagItem.waitFor({ state: "visible", timeout: 5000 });

    // Click the tag item and wait for the PUT mutation to complete.
    // The onSelect → onTagsChange → setExerciseTags call PUTs to the API.
    const tagPutPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/tags") && resp.request().method() === "PUT",
      { timeout: 10000 }
    );
    await tagItem.click();
    const tagPutResp = await tagPutPromise;
    if (!tagPutResp.ok()) {
      const body = await tagPutResp.text().catch(() => "");
      throw new Error(`Tags PUT to ${tagPutResp.url()} failed: ${tagPutResp.status()} ${body}`);
    }

    // Close the popover
    await page.keyboard.press("Escape");

    // Reload and verify tag persists (the mutation + refetch cycle is more
    // reliably verified after a full page reload).
    await page.reload();
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    // Check that the tag badge is displayed after reload
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: tagName }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("filter exercises by tag — verify filtered results", async ({
    page,
  }) => {
    const tagName = uniqueName("E2E Filter-Tag");

    await loginAs(page, TEST_USERS.OWNER);

    // Create the tag via settings
    await gotoTagsSettings(page);
    await page.getByPlaceholder(/New tag name/i).fill(tagName);
    await page.getByRole("button", { name: /Add Tag/i }).click();
    await waitForToast(page, "Tag created");

    // Create two exercises — one will have the tag, one won't
    const taggedExercise = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Tagged"),
    });
    exerciseId = taggedExercise.id;

    const untaggedExercise = await createExerciseViaAPI(page, {
      skill: "WRITING",
      title: uniqueName("E2E Untagged"),
    });

    // Assign tag to the tagged exercise via API
    const token = await page.evaluate(() => localStorage.getItem("token"));
    const backendUrl = process.env.VITE_API_URL || "http://localhost:4000";

    // Get tags to find our tag's ID
    const tagsResp = await page.request.get(`${backendUrl}/api/v1/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tagsBody = await tagsResp.json();
    const tags = tagsBody.data ?? tagsBody;
    const ourTag = Array.isArray(tags)
      ? tags.find((t: { name: string }) => t.name === tagName)
      : null;

    expect(ourTag).toBeTruthy();

    if (ourTag) {
      const tagResp = await page.request.put(
        `${backendUrl}/api/v1/exercises/${taggedExercise.id}/tags`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { tagIds: [ourTag.id] },
        }
      );
      if (!tagResp.ok()) {
        const body = await tagResp.text().catch(() => "");
        throw new Error(`Tags PUT to ${tagResp.url()} failed: ${tagResp.status()} ${body}`);
      }
    }

    // Navigate to exercise library
    await gotoExercises(page);

    // Apply the tag filter — the exercise list may have many pages from
    // previous runs, so we filter by tag first to narrow results.
    // The "All Tags" button opens a Popover with cmdk Command inside.
    const tagFilterButton = page
      .locator('[role="combobox"]')
      .filter({ hasText: /All Tags|tag/i })
      .first();
    await tagFilterButton.waitFor({ state: "visible", timeout: 10000 });
    await tagFilterButton.click();

    // Search for the tag in the cmdk Command input
    const tagSearchInput = page.getByPlaceholder(/Search tags/i).first();
    await tagSearchInput.waitFor({ state: "visible", timeout: 5000 });
    await tagSearchInput.pressSequentially(tagName, { delay: 20 });

    // Click the CommandItem matching our tag
    const tagItem = page
      .locator('[cmdk-item], [data-slot="command-item"]')
      .filter({ hasText: tagName })
      .first();
    await tagItem.waitFor({ state: "visible", timeout: 5000 });
    await tagItem.click();

    // Wait for filtered results to load
    await page.waitForLoadState("networkidle");

    // Verify tagged exercise is visible after filtering
    await expect(page.getByText(taggedExercise.title)).toBeVisible({
      timeout: 10000,
    });

    // Verify untagged exercise is not visible (filter excludes it)
    await expect(page.getByText(untaggedExercise.title)).not.toBeVisible();

    // Cleanup the untagged exercise too
    try {
      await page.request.delete(
        `${backendUrl}/api/v1/exercises/${untaggedExercise.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // ignore
    }
  });
});
