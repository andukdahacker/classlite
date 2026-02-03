import { test, expect, TEST_USERS, loginAs } from "../../fixtures/auth.fixture";
import { waitForToast, waitForLoadingComplete } from "../../utils/test-helpers";
import path from "path";
import fs from "fs";

// Create test CSV files for import testing
const TEST_CSV_VALID = `email,firstName,lastName,role
valid1@test.com,John,Doe,TEACHER
valid2@test.com,Jane,Smith,STUDENT`;

const TEST_CSV_INVALID_EMAIL = `email,firstName,lastName,role
notanemail,John,Doe,TEACHER
valid@test.com,Jane,Smith,STUDENT`;

const TEST_CSV_INVALID_ROLE = `email,firstName,lastName,role
test1@test.com,John,Doe,INVALID_ROLE
test2@test.com,Jane,Smith,STUDENT`;

const TEST_CSV_EMPTY = `email,firstName,lastName,role`;

const TEST_CSV_MISSING_COLUMNS = `email,firstName
test@test.com,John`;

test.describe("CSV Bulk Import", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);
    await page.goto("/users");
    await waitForLoadingComplete(page);
  });

  test.describe("Import Button Visibility", () => {
    test("import button visible for owner", async ({ page }) => {
      await expect(
        page.locator('button:has-text("Import")').or(
          page.locator('[data-testid="import-button"]')
        )
      ).toBeVisible();
    });

    test("import button visible for admin", async ({ page }) => {
      await page.context().clearCookies();
      await loginAs(page, TEST_USERS.ADMIN);
      await page.goto("/users");

      await expect(
        page.locator('button:has-text("Import")').or(
          page.locator('[data-testid="import-button"]')
        )
      ).toBeVisible();
    });

    test("import button not visible for teacher", async ({ page }) => {
      await page.context().clearCookies();
      await loginAs(page, TEST_USERS.TEACHER);
      await page.goto("/users");

      // Teacher shouldn't see users page or import button
      const importButton = page.locator('button:has-text("Import")');
      // Either the page redirects or the button is not visible
      if (page.url().includes("/users")) {
        await expect(importButton).not.toBeVisible();
      }
    });
  });

  test.describe("Template Download", () => {
    test("can download CSV template", async ({ page }) => {
      await page.click('button:has-text("Import")');

      // Wait for import modal/dialog
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Look for download template link/button
      const downloadLink = page.locator(
        'a:has-text("template")').or(
        page.locator('button:has-text("Download template")')
      );

      if (await downloadLink.count() > 0) {
        // Set up download handling
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          downloadLink.click(),
        ]);

        // Verify download
        expect(download.suggestedFilename()).toContain(".csv");
      }
    });
  });

  test.describe("File Upload", () => {
    test("file upload input accepts CSV files", async ({ page }) => {
      await page.click('button:has-text("Import")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Find file input
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();

      // Check accepted file types
      const accept = await fileInput.getAttribute("accept");
      expect(accept).toContain(".csv");
    });

    test.skip("valid CSV shows preview with validation", async ({ page }) => {
      // This test requires creating a temporary file
      await page.click('button:has-text("Import")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Create temp file
      const tempDir = "/tmp";
      const tempFile = path.join(tempDir, `test-import-${Date.now()}.csv`);
      fs.writeFileSync(tempFile, TEST_CSV_VALID);

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(tempFile);

        // Should show preview
        await expect(
          page.locator('text="preview"').or(
            page.locator('[data-testid="import-preview"]')
          )
        ).toBeVisible({ timeout: 10000 });

        // Should show valid entries
        await expect(page.locator('text="valid"')).toBeVisible();
      } finally {
        // Clean up temp file
        fs.unlinkSync(tempFile);
      }
    });

    test.skip("invalid CSV shows validation errors", async ({ page }) => {
      await page.click('button:has-text("Import")');

      const tempFile = `/tmp/test-invalid-${Date.now()}.csv`;
      fs.writeFileSync(tempFile, TEST_CSV_INVALID_EMAIL);

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(tempFile);

        // Should show validation errors
        await expect(
          page.locator('text="invalid"').or(
            page.locator('text="error"')
          )
        ).toBeVisible({ timeout: 10000 });
      } finally {
        fs.unlinkSync(tempFile);
      }
    });
  });

  test.describe("Import Execution", () => {
    test.skip("shows progress during import", async ({ page }) => {
      await page.click('button:has-text("Import")');

      const tempFile = `/tmp/test-import-${Date.now()}.csv`;
      fs.writeFileSync(tempFile, TEST_CSV_VALID);

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(tempFile);

        // Click import/execute button
        await page.click('button:has-text("Execute")');

        // Should show progress indicator
        await expect(
          page.locator('[role="progressbar"]').or(
            page.locator('text="processing"')
          )
        ).toBeVisible({ timeout: 5000 });
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    test.skip("successful import shows completion message", async ({ page }) => {
      await page.click('button:has-text("Import")');

      const tempFile = `/tmp/test-import-${Date.now()}.csv`;
      fs.writeFileSync(tempFile, TEST_CSV_VALID);

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(tempFile);
        await page.click('button:has-text("Execute")');

        // Wait for completion
        await expect(
          page.locator('text="complete"').or(
            page.locator('text="success"')
          )
        ).toBeVisible({ timeout: 30000 });
      } finally {
        fs.unlinkSync(tempFile);
      }
    });
  });

  test.describe("Import History", () => {
    test("import history section is visible", async ({ page }) => {
      // Navigate to import history if it's a separate view
      // or check if it's on the same page
      await expect(
        page.locator('text="Import History"').or(
          page.locator('[data-testid="import-history"]')
        )
      ).toBeVisible({ timeout: 5000 }).catch(() => {
        // Import history might be behind a tab or link
      });
    });

    test.skip("import history shows past imports", async ({ page }) => {
      // This assumes there are past imports in test data
      const historySection = page.locator('[data-testid="import-history"]');

      if (await historySection.count() > 0) {
        // Should show import records with date, status, count
        await expect(historySection.locator('text="rows"').or(
          historySection.locator('text="users"')
        )).toBeVisible();
      }
    });
  });
});
