import { expect } from "@playwright/test";
import {
  test,
  TEST_USERS,
  loginAs,
  getAppUrl,
} from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";

test.describe("Student Health RBAC", () => {
  test.describe.configure({ mode: "serial" });

  test("STUDENT cannot access /students page", async ({ page }) => {
    await loginAs(page, TEST_USERS.STUDENT);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");

    // Student should be redirected or see an error — not the dashboard
    const heading = page.getByRole("heading", { name: "Student Health" });
    await expect(heading).not.toBeVisible({ timeout: 5000 });
  });

  test("OWNER can access /students page", async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    await expect(
      page.getByRole("heading", { name: "Student Health" })
    ).toBeVisible({ timeout: 10000 });
  });

  test("ADMIN can access /students page", async ({ page }) => {
    await loginAs(page, TEST_USERS.ADMIN);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    await expect(
      page.getByRole("heading", { name: "Student Health" })
    ).toBeVisible({ timeout: 10000 });
  });

  test("TEACHER can access /students page", async ({ page }) => {
    await loginAs(page, TEST_USERS.TEACHER);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    await expect(
      page.getByRole("heading", { name: "Student Health" })
    ).toBeVisible({ timeout: 10000 });
  });

  test('TEACHER cannot see "Contact Parent" on overlay', async ({ page }) => {
    await loginAs(page, TEST_USERS.TEACHER);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await expect(
      overlay.getByRole("button", { name: /Contact Parent/i })
    ).not.toBeVisible({ timeout: 2000 });
  });

  test('OWNER can see "Contact Parent" on overlay', async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await expect(
      overlay.getByRole("button", { name: /Contact Parent/i })
    ).toBeVisible();
  });

  test('ADMIN can see "Contact Parent" on overlay', async ({ page }) => {
    await loginAs(page, TEST_USERS.ADMIN);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await expect(
      overlay.getByRole("button", { name: /Contact Parent/i })
    ).toBeVisible();
  });

  test('TEACHER can see "Flag for Admin" on overlay', async ({ page }) => {
    await loginAs(page, TEST_USERS.TEACHER);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await expect(
      overlay.getByRole("button", { name: /Flag for Admin/i })
    ).toBeVisible();
  });

  test('OWNER does NOT see "Flag for Admin" on overlay', async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    const studentCard = page
      .locator('[role="button"]')
      .filter({ has: page.locator("text=Attendance") })
      .first();
    const hasCards = await studentCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, "No student cards visible");
      return;
    }

    await studentCard.click();
    const overlay = page
      .locator('[data-slot="sheet-content"], [role="dialog"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await expect(
      overlay.getByRole("button", { name: /Flag for Admin/i })
    ).not.toBeVisible({ timeout: 2000 });
  });
});
