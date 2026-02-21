import { expect } from "@playwright/test";
import {
  test,
  TEST_USERS,
  loginAs,
  getAppUrl,
} from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";
import { waitForToast } from "../../utils/test-helpers";

test.describe("Teacher Student Health View (Story 6.4)", () => {
  test.describe.configure({ mode: "serial" });

  test("Teacher can access student health dashboard", async ({ page }) => {
    await loginAs(page, TEST_USERS.TEACHER);
    await page.goto(getAppUrl("/dashboard/students"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    await expect(
      page.getByRole("heading", { name: "Student Health" })
    ).toBeVisible();
  });

  test('Teacher profile overlay does NOT show "Contact Parent" button', async ({
    page,
  }) => {
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

    // "Contact Parent" should NOT be visible for teachers
    await expect(
      overlay.getByRole("button", { name: /Contact Parent/i })
    ).not.toBeVisible({ timeout: 2000 });
  });

  test('Teacher profile overlay shows "Flag for Admin" button', async ({
    page,
  }) => {
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

  test("Teacher can flag student with note", async ({ page }) => {
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

    // Click "Flag for Admin"
    await overlay
      .getByRole("button", { name: /Flag for Admin/i })
      .click();

    // Flag modal should open
    const flagDialog = page.getByRole("dialog").filter({
      hasText: /Flag Student/i,
    });
    await expect(flagDialog).toBeVisible({ timeout: 5000 });

    // Fill in note (must be 10+ characters)
    const textarea = flagDialog.locator("textarea");
    await textarea.fill("Student has been absent frequently and needs attention from admin.");

    // Submit the flag
    await flagDialog
      .getByRole("button", { name: /Flag Student/i })
      .click();

    // Success toast
    await waitForToast(page, "Student flagged");
  });

  test("Flag modal requires minimum 10 characters", async ({ page }) => {
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

    await overlay
      .getByRole("button", { name: /Flag for Admin/i })
      .click();

    const flagDialog = page.getByRole("dialog").filter({
      hasText: /Flag Student/i,
    });
    await expect(flagDialog).toBeVisible({ timeout: 5000 });

    // Type less than 10 characters
    const textarea = flagDialog.locator("textarea");
    await textarea.fill("short");

    // "Flag Student" button should be disabled
    const submitBtn = flagDialog.getByRole("button", {
      name: /Flag Student/i,
    });
    await expect(submitBtn).toBeDisabled();

    // Now type enough characters
    await textarea.fill("This is a longer note that exceeds ten characters.");
    await expect(submitBtn).toBeEnabled();
  });

  test("Teacher overlay shows only 3 tabs (no Interventions)", async ({
    page,
  }) => {
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

    // Should have Trends, Attendance, Assignments tabs
    const tabs = overlay.locator('[role="tab"]');
    await expect(tabs.filter({ hasText: "Trends" })).toBeVisible();
    await expect(tabs.filter({ hasText: "Attendance" })).toBeVisible();
    await expect(tabs.filter({ hasText: "Assignments" })).toBeVisible();

    // Should NOT have Interventions tab
    await expect(
      tabs.filter({ hasText: "Interventions" })
    ).not.toBeVisible({ timeout: 2000 });
  });

  test('Teacher dashboard shows "My Students at Risk" widget', async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.TEACHER);
    await page.goto(getAppUrl("/dashboard"));
    await page.waitForLoadState("networkidle");
    await closeAIAssistantDialog(page);

    // The TeacherAtRiskWidget should be visible on the teacher dashboard
    await expect(
      page.getByText("My Students at Risk")
    ).toBeVisible({ timeout: 10000 });
  });
});
