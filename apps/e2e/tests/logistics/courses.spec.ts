import { test, expect, TEST_USERS, loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";

/**
 * Helper: navigate to courses page and wait for content to load.
 */
async function gotoCourses(page: import("@playwright/test").Page, user: (typeof TEST_USERS)[keyof typeof TEST_USERS]) {
  await loginAs(page, user);
  await page.goto(getAppUrl("/courses"));
  await page.waitForLoadState("networkidle");
  await closeAIAssistantDialog(page);
  await page.getByRole("heading", { name: "Courses" }).first().waitFor({ timeout: 15000 });
}

test.describe("Courses - Page Structure", () => {
  test.beforeEach(async ({ page }) => {
    await gotoCourses(page, TEST_USERS.OWNER);
  });

  test("displays the Courses heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Courses" }).first()
    ).toBeVisible();
  });

  test("displays table with correct columns", async ({ page }) => {
    await expect(page.locator("th").filter({ hasText: "Color" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Name" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Description" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Actions" }).first()).toBeVisible();
  });

  test("shows seeded E2E Test Course row", async ({ page }) => {
    await expect(page.locator("td").filter({ hasText: "E2E Test Course" }).first()).toBeVisible();
  });
});

test.describe("Courses - RBAC", () => {
  test("owner sees New Course button", async ({ page }) => {
    await gotoCourses(page, TEST_USERS.OWNER);

    await expect(
      page.getByRole("button", { name: "New Course" }).first()
    ).toBeVisible();
  });

  test("admin sees New Course button", async ({ page }) => {
    await gotoCourses(page, TEST_USERS.ADMIN);

    await expect(
      page.getByRole("button", { name: "New Course" }).first()
    ).toBeVisible();
  });

  test("teacher does NOT see New Course button", async ({ page }) => {
    await gotoCourses(page, TEST_USERS.TEACHER);

    await expect(
      page.getByRole("button", { name: "New Course" })
    ).toHaveCount(0);
  });

  test("student is redirected away from courses", async ({ page }) => {
    await loginAs(page, TEST_USERS.STUDENT);
    await closeAIAssistantDialog(page);
    await page.goto(getAppUrl("/courses"));
    await page.waitForLoadState("networkidle");

    expect(page.url()).not.toContain("/courses");
  });
});

test.describe("Courses - Create Course Flow", () => {
  test.beforeEach(async ({ page }) => {
    await gotoCourses(page, TEST_USERS.OWNER);
  });

  test("New Course button opens drawer with step-1 fields", async ({ page }) => {
    await page.getByRole("button", { name: "New Course" }).first().click();

    // Wait for drawer to open
    await expect(page.getByText("Create New Course")).toBeVisible({ timeout: 5000 });

    // Step 1 fields should be present
    await expect(page.getByLabel("Course Name")).toBeVisible();
    await expect(page.getByLabel("Description")).toBeVisible();
    await expect(page.getByLabel("Brand Color")).toBeVisible();
  });

  test("wizard Next/Back navigation works", async ({ page }) => {
    await page.getByRole("button", { name: "New Course" }).first().click();
    await expect(page.getByText("Create New Course")).toBeVisible({ timeout: 5000 });

    // Fill required field so Next validates
    await page.getByLabel("Course Name").fill("Test Navigation Course");

    // Click Next to go to step 2
    await page.getByRole("button", { name: /Next/ }).click();
    await page.waitForTimeout(500);

    // Step 2 should show scheduling content
    await expect(page.getByText("Scheduling & Roster")).toBeVisible({ timeout: 5000 });

    // Click Back to return to step 1
    await page.getByRole("button", { name: /Back/ }).click();
    await page.waitForTimeout(500);

    // Step 1 fields should be visible again
    await expect(page.getByLabel("Course Name")).toBeVisible();
  });
});

test.describe("Courses - Edit Course", () => {
  test("edit icon opens drawer pre-filled with course data", async ({ page }) => {
    await gotoCourses(page, TEST_USERS.OWNER);

    await page.locator("td").filter({ hasText: "E2E Test Course" }).first().waitFor({ timeout: 10000 });
    const courseRow = page.locator("tr").filter({ hasText: "E2E Test Course" });
    await courseRow.getByRole("button", { name: "Edit" }).click();

    await expect(page.getByText("Edit Course")).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel("Course Name")).toHaveValue("E2E Test Course");
  });
});
