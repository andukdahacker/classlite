import { test, expect, TEST_USERS, loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";

/**
 * Helper: navigate to classes page and wait for content to load.
 * The classes page uses Loader2, so we wait for the heading to appear.
 */
async function gotoClasses(page: import("@playwright/test").Page, user: (typeof TEST_USERS)[keyof typeof TEST_USERS]) {
  await loginAs(page, user);
  await page.goto(getAppUrl("/classes"));
  await page.waitForLoadState("networkidle");
  await closeAIAssistantDialog(page);
  await page.getByRole("heading", { name: "Classes" }).first().waitFor({ timeout: 15000 });
}

test.describe("Classes - Page Structure", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClasses(page, TEST_USERS.OWNER);
  });

  test("displays the Classes heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Classes" }).first()
    ).toBeVisible();
  });

  test("displays table with correct columns", async ({ page }) => {
    await expect(page.locator("th").filter({ hasText: "Class Name" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Course" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Students" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Actions" }).first()).toBeVisible();
  });

  test("shows seeded E2E Test Class row", async ({ page }) => {
    await expect(page.locator("td").filter({ hasText: "E2E Test Class" }).first()).toBeVisible();
  });
});

test.describe("Classes - RBAC", () => {
  test("owner sees action buttons", async ({ page }) => {
    await gotoClasses(page, TEST_USERS.OWNER);

    await expect(
      page.getByRole("button", { name: "New Class" }).first()
    ).toBeVisible();

    // Wait for table data to appear before checking row buttons
    await page.locator("td").filter({ hasText: "E2E Test Class" }).first().waitFor({ timeout: 10000 });
    const classRow = page.locator("tr").filter({ hasText: "E2E Test Class" });
    await expect(classRow.getByRole("button", { name: "Roster" })).toBeVisible();
  });

  test("teacher does NOT see action buttons", async ({ page }) => {
    await gotoClasses(page, TEST_USERS.TEACHER);

    await expect(
      page.getByRole("button", { name: "New Class" })
    ).toHaveCount(0);
  });

  test("student is redirected away from classes", async ({ page }) => {
    await loginAs(page, TEST_USERS.STUDENT);
    await closeAIAssistantDialog(page);
    await page.goto(getAppUrl("/classes"));
    await page.waitForLoadState("networkidle");

    expect(page.url()).not.toContain("/classes");
  });
});

test.describe("Classes - Class Drawer", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClasses(page, TEST_USERS.OWNER);
  });

  test("create drawer opens with form fields", async ({ page }) => {
    await page.getByRole("button", { name: "New Class" }).first().click();
    await page.waitForTimeout(300);

    await expect(page.getByText("Create New Class")).toBeVisible();
    await expect(page.getByLabel("Class Name")).toBeVisible();
    // Course is a Select field, check for label text
    await expect(page.getByText("Course").first()).toBeVisible();
  });

  test("edit drawer opens pre-filled with class data", async ({ page }) => {
    await page.locator("td").filter({ hasText: "E2E Test Class" }).first().waitFor({ timeout: 10000 });
    const classRow = page.locator("tr").filter({ hasText: "E2E Test Class" });
    await classRow.getByRole("button", { name: "Edit" }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText("Edit Class")).toBeVisible();
    await expect(page.getByLabel("Class Name")).toHaveValue("E2E Test Class");
  });
});

test.describe("Classes - Roster Manager", () => {
  test("roster dialog opens showing student list", async ({ page }) => {
    await gotoClasses(page, TEST_USERS.OWNER);

    await page.locator("td").filter({ hasText: "E2E Test Class" }).first().waitFor({ timeout: 10000 });
    const classRow = page.locator("tr").filter({ hasText: "E2E Test Class" });
    await classRow.getByRole("button", { name: "Roster" }).click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Roster:")).toBeVisible();
  });
});
