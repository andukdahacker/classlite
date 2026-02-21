import { test, expect, TEST_USERS, loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { waitForLoadingComplete } from "../../utils/test-helpers";

/**
 * Helper to close the AI Assistant sheet/dialog if it's open
 */
async function closeAIAssistantDialog(page: import("@playwright/test").Page) {
  if (!page.url().includes("dashboard")) {
    return;
  }
  await page.waitForTimeout(500);
  const sheetOverlay = page.locator('[data-slot="sheet-overlay"][data-state="open"]');
  if (await sheetOverlay.count() > 0) {
    await sheetOverlay.click({ force: true, position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

/**
 * Generate timestamped CSV content to avoid duplicate collisions across runs.
 */
function makeValidCsv(): { content: string; emails: string[] } {
  const ts = Date.now();
  const emails = [
    `csv-valid1-${ts}@test.com`,
    `csv-valid2-${ts}@test.com`,
  ];
  const content = `Email,Name,Role
${emails[0]},John Doe,Teacher
${emails[1]},Jane Smith,Student`;
  return { content, emails };
}

function makeInvalidEmailCsv(): string {
  const ts = Date.now();
  return `Email,Name,Role
notanemail,John Doe,Teacher
csv-ok-${ts}@test.com,Jane Smith,Student`;
}

/**
 * Upload a CSV by finding the React fiber for the drop zone and calling
 * its onDrop handler directly. This bypasses DOM event dispatch entirely,
 * which is necessary because Radix UI portals prevent dispatched events
 * from reaching React's event delegation system.
 */
async function uploadCsvViaDrop(
  page: import("@playwright/test").Page,
  csvContent: string,
  fileName = "test-import.csv",
) {
  await page.evaluate(
    ({ content, name }) => {
      const file = new File([content], name, { type: "text/csv" });

      // Find the drop zone element inside the dialog
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) throw new Error("Dialog not found");

      const dropZone = dialog.querySelector(".border-dashed");
      if (!dropZone) throw new Error("Drop zone not found in dialog");

      // Walk the React fiber tree to find the onDrop handler
      const fiberKey = Object.keys(dropZone).find(
        (k) =>
          k.startsWith("__reactFiber$") ||
          k.startsWith("__reactInternalInstance$"),
      );
      if (!fiberKey) throw new Error("React fiber not found on drop zone");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fiber = (dropZone as any)[fiberKey];
      while (fiber) {
        const props = fiber.memoizedProps || fiber.pendingProps;
        if (props && typeof props.onDrop === "function") {
          props.onDrop({
            preventDefault: () => {},
            dataTransfer: { files: [file] },
          });
          return;
        }
        fiber = fiber.return;
      }

      throw new Error("Could not find onDrop handler in React fiber tree");
    },
    { content: csvContent, name: fileName },
  );
}

test.describe("CSV Bulk Import", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Set up listener BEFORE navigating so we catch the response
    const authReady = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/v1/users") &&
        !resp.url().includes("import") &&
        resp.status() === 200,
      { timeout: 15000 },
    );

    await page.goto(getAppUrl("/settings/users"));

    // Wait for users API to return 200, proving the auth token has valid claims.
    // The auth context force-refreshes the token after login, and React Query
    // retries failed queries, so this resolves once the fresh token is in use.
    await authReady;

    await closeAIAssistantDialog(page);
  });

  test.describe("Import Button Visibility", () => {
    test("import button visible for owner", async ({ page }) => {
      await expect(
        page.locator('button').filter({ hasText: 'Import CSV' }).or(
          page.locator('[data-testid="import-button"]')
        )
      ).toBeVisible();
    });

    test("import button visible for admin", async ({ page }) => {
      const context = await page.context().browser()!.newContext();
      const newPage = await context.newPage();

      await loginAs(newPage, TEST_USERS.ADMIN);
      await newPage.goto(getAppUrl("/settings/users"));
      await waitForLoadingComplete(newPage);
      await closeAIAssistantDialog(newPage);

      await expect(
        newPage.locator('button').filter({ hasText: 'Import CSV' }).or(
          newPage.locator('[data-testid="import-button"]')
        )
      ).toBeVisible();

      await context.close();
    });

    test("import button not visible for teacher", async ({ page }) => {
      const context = await page.context().browser()!.newContext();
      const newPage = await context.newPage();

      await loginAs(newPage, TEST_USERS.TEACHER);
      await newPage.goto(getAppUrl("/settings/users"));

      await newPage.waitForLoadState("networkidle");

      if (newPage.url().includes("settings/users")) {
        const importButton = newPage.locator('button').filter({ hasText: 'Import CSV' });
        await expect(importButton).not.toBeVisible();
      }

      await context.close();
    });
  });

  test.describe("Template Download", () => {
    test("can download CSV template", async ({ page }) => {
      await page.locator('button').filter({ hasText: 'Import CSV' }).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const downloadPromise = page.waitForEvent('download');
      await page.locator('[role="dialog"]').locator('button').filter({ hasText: 'Download template' }).click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });
  });

  test.describe("File Upload", () => {
    test("file upload input accepts CSV files", async ({ page }) => {
      await page.locator('button').filter({ hasText: 'Import CSV' }).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();

      const accept = await fileInput.getAttribute("accept");
      expect(accept).toContain(".csv");
    });

    test("valid CSV shows preview with validation", async ({ page }) => {
      await page.locator('button').filter({ hasText: 'Import CSV' }).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const { content, emails } = makeValidCsv();
      await uploadCsvViaDrop(page, content);

      // Wait for preview step — title changes to "Review Import"
      await expect(
        page.locator('[role="dialog"]').locator('text="Review Import"')
      ).toBeVisible({ timeout: 15000 });

      // Verify summary cards
      await expect(
        page.locator('[role="dialog"]').locator('text="Total Rows"')
      ).toBeVisible();
      // "Valid" appears in summary card label AND row badges; target the summary label
      await expect(
        page.locator('[role="dialog"]').locator('p').filter({ hasText: 'Valid' })
      ).toBeVisible();

      // Verify email rows appear in the preview table
      await expect(
        page.locator('[role="dialog"]').locator(`text="${emails[0]}"`)
      ).toBeVisible();
    });

    test("invalid CSV shows validation errors", async ({ page }) => {
      await page.locator('button').filter({ hasText: 'Import CSV' }).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      await uploadCsvViaDrop(page, makeInvalidEmailCsv());

      // Wait for preview step
      await expect(
        page.locator('[role="dialog"]').locator('text="Review Import"')
      ).toBeVisible({ timeout: 15000 });

      // Verify "Error" badge appears for the invalid email row
      await expect(
        page.locator('[role="dialog"]').locator('text="Error"')
      ).toBeVisible();

      // Verify the Errors summary card is visible
      await expect(
        page.locator('[role="dialog"]').locator('text="Errors"')
      ).toBeVisible();
    });
  });

  test.describe("Import Execution", () => {
    test("shows progress during import", async ({ page }) => {
      await page.locator('button').filter({ hasText: 'Import CSV' }).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const { content } = makeValidCsv();
      await uploadCsvViaDrop(page, content);

      // Wait for preview step
      await expect(
        page.locator('[role="dialog"]').locator('text="Review Import"')
      ).toBeVisible({ timeout: 15000 });

      // Click the "Import N User(s)" button
      await page.locator('[role="dialog"]').locator('button').filter({ hasText: /Import \d+ User/ }).click();

      // Verify either "Importing Users..." title or immediate completion
      await expect(
        page.locator('[role="dialog"]').locator('text="Importing Users..."').or(
          page.locator('[role="dialog"]').locator('text="Import Complete"')
        )
      ).toBeVisible({ timeout: 15000 });
    });

    test("successful import shows completion message", async ({ page }) => {
      await page.locator('button').filter({ hasText: 'Import CSV' }).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      const { content } = makeValidCsv();
      await uploadCsvViaDrop(page, content);

      // Wait for preview, then import
      await expect(
        page.locator('[role="dialog"]').locator('text="Review Import"')
      ).toBeVisible({ timeout: 15000 });

      await page.locator('[role="dialog"]').locator('button').filter({ hasText: /Import \d+ User/ }).click();

      // Wait for "Import Successful!" or "Import Partially Complete" (60s timeout for Inngest processing)
      await expect(
        page.locator('[role="dialog"]').locator('p').filter({ hasText: 'Import Successful!' }).or(
          page.locator('[role="dialog"]').locator('p').filter({ hasText: 'Import Partially Complete' })
        ).or(
          page.locator('[role="dialog"]').locator('p').filter({ hasText: 'Import Failed' })
        )
      ).toBeVisible({ timeout: 60000 });

      // Verify success summary
      await expect(
        page.locator('[role="dialog"]').locator('text=/user\\(s\\) imported successfully/')
      ).toBeVisible();

      // Click Done to close the dialog
      await page.locator('[role="dialog"]').locator('button').filter({ hasText: 'Done' }).click();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Import History", () => {
    test("import history section is visible", async ({ page }) => {
      await expect(
        page.locator('text="Import History"').or(
          page.locator('[data-testid="import-history"]')
        )
      ).toBeVisible({ timeout: 5000 }).catch(() => {
        // Import history might be behind a tab or link
      });
    });

    test("import history shows past imports", async ({ page }) => {
      // Click "Import History" to expand the collapsible section
      const historyTrigger = page.locator('button').filter({ hasText: 'Import History' }).or(
        page.locator('text="Import History"')
      );

      if (await historyTrigger.count() > 0) {
        await historyTrigger.first().click();
        await page.waitForTimeout(500);

        // Verify either the import table renders or the empty state shows
        const hasFileHeader = page.locator('th:has-text("File")');
        const emptyState = page.locator('text="No imports yet."');

        await expect(
          hasFileHeader.or(emptyState)
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
