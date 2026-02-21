import { test, expect, TEST_USERS, loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";
import {
  uniqueName,
  createExerciseViaAPI,
  publishExerciseViaAPI,
  cleanupExercise,
} from "../../fixtures/exercise-fixtures";
import {
  createAssignmentViaAPI,
  cleanupAssignment,
} from "../../fixtures/assignment-fixtures";
import type { Page } from "@playwright/test";
import type { UserRole } from "../../fixtures/auth.fixture";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoDashboard(page: Page, user: (typeof TEST_USERS)[keyof typeof TEST_USERS]) {
  await loginAs(page, user);
  await page.goto(getAppUrl("/dashboard"));
  await page.waitForLoadState("networkidle");
  await closeAIAssistantDialog(page);
}

// ---------------------------------------------------------------------------
// Group 1: Dashboard RBAC
// ---------------------------------------------------------------------------

test.describe("Dashboard RBAC", () => {
  const roles: UserRole[] = ["OWNER", "ADMIN", "TEACHER", "STUDENT"];

  for (const role of roles) {
    test(`${role} can access dashboard`, async ({ page }) => {
      await loginAs(page, TEST_USERS[role]);
      await page.goto(getAppUrl("/dashboard"));
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("/dashboard");
    });
  }
});

// ---------------------------------------------------------------------------
// Group 2: Owner Dashboard
// ---------------------------------------------------------------------------

test.describe("Owner Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page, TEST_USERS.OWNER);
  });

  test("displays Student Health heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Student Health" })
    ).toBeVisible();
  });

  test("shows summary stat cards with labels and values", async ({ page }) => {
    await expect(page.getByText("Total Students")).toBeVisible();
    await expect(page.getByText("At Risk").first()).toBeVisible();
    await expect(page.getByText("Warning").first()).toBeVisible();
    await expect(page.getByText("On Track").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 3: Teacher Dashboard
// ---------------------------------------------------------------------------

test.describe("Teacher Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page, TEST_USERS.TEACHER);
  });

  test("displays Grading Queue heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Grading Queue" })
    ).toBeVisible();
  });

  test("shows empty queue message", async ({ page }) => {
    await expect(
      page.getByText("No submissions pending grading.")
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 4: Admin Dashboard
// ---------------------------------------------------------------------------

test.describe("Admin Dashboard", () => {
  test("ADMIN sees Student Health dashboard", async ({ page }) => {
    await gotoDashboard(page, TEST_USERS.ADMIN);
    await expect(
      page.getByRole("heading", { name: "Student Health" })
    ).toBeVisible();
    await expect(
      page.getByText("At-a-glance view of student engagement")
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 5: Student Dashboard — Layout & Filters
// ---------------------------------------------------------------------------

test.describe("Student Dashboard — Layout & Filters", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page, TEST_USERS.STUDENT);
  });

  test("displays Your Tasks heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Your Tasks" })
    ).toBeVisible();
  });

  test("shows skill filter with correct options", async ({ page }) => {
    // Open skill filter dropdown
    const skillTrigger = page.locator('[role="combobox"]').first();
    await skillTrigger.click();

    const expectedOptions = ["All Skills", "Reading", "Listening", "Writing", "Speaking"];
    for (const option of expectedOptions) {
      await expect(
        page.getByRole("option", { name: option })
      ).toBeVisible();
    }
  });

  test("shows status filter with Open default", async ({ page }) => {
    // The status trigger shows "Open" by default
    const statusTrigger = page.locator('[role="combobox"]').nth(1);
    await expect(statusTrigger).toHaveText("Open");

    // Open status dropdown
    await statusTrigger.click();

    const expectedOptions = ["All", "Open", "Closed"];
    for (const option of expectedOptions) {
      await expect(
        page.getByRole("option", { name: option, exact: true })
      ).toBeVisible();
    }
  });

  test("skill filter change triggers API refetch", async ({ page }) => {
    // Listen for API response
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/student/assignments") && resp.status() === 200
    );

    // Change skill filter to Reading
    const skillTrigger = page.locator('[role="combobox"]').first();
    await skillTrigger.click();
    await page.getByRole("option", { name: "Reading" }).click();

    // Verify API call was made
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
  });

  test("status filter change triggers API refetch", async ({ page }) => {
    // Listen for API response
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/student/assignments") && resp.status() === 200
    );

    // Change status filter to All
    const statusTrigger = page.locator('[role="combobox"]').nth(1);
    await statusTrigger.click();
    await page.getByRole("option", { name: "All", exact: true }).click();

    // Verify API call was made
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Group 6: Student Dashboard — Assignment Cards
// ---------------------------------------------------------------------------

test.describe("Student Dashboard — Assignment Cards", () => {
  let exerciseId: string;
  let assignmentId: string;
  let exerciseTitle: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAs(page, TEST_USERS.OWNER);

    const exercise = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Dashboard Exercise"),
    });
    exerciseId = exercise.id;
    exerciseTitle = exercise.title;
    await publishExerciseViaAPI(page, exercise.id);

    const assignment = await createAssignmentViaAPI(page, {
      exerciseId: exercise.id,
      classIds: ["e2e-test-class"],
    });
    assignmentId = assignment.id;

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAs(page, TEST_USERS.OWNER);
    await cleanupAssignment(page, assignmentId);
    await cleanupExercise(page, exerciseId);
    await ctx.close();
  });

  test("assignment card displays exercise title and badge", async ({ page }) => {
    await gotoDashboard(page, TEST_USERS.STUDENT);

    await expect(page.getByRole("heading", { name: "Your Tasks" })).toBeVisible();
    await expect(page.getByText(exerciseTitle)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Start/ }).first()).toBeVisible();
  });

  test("assignment cards show urgency section headings", async ({ page }) => {
    await gotoDashboard(page, TEST_USERS.STUDENT);

    // At least one urgency section heading should be visible
    const headings = page.locator("h2");
    const headingTexts = await headings.allTextContents();
    const urgencyPattern = /Overdue|Due Today|Due This Week|Upcoming|No Deadline/;
    const hasUrgencyHeading = headingTexts.some((text) => urgencyPattern.test(text));
    expect(hasUrgencyHeading).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Group 7: Notification Bell
// ---------------------------------------------------------------------------

test.describe("Notification Bell", () => {
  const roles: UserRole[] = ["OWNER", "ADMIN", "TEACHER", "STUDENT"];

  test("notification bell visible for all roles", async ({ browser }) => {
    for (const role of roles) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await gotoDashboard(page, TEST_USERS[role]);
      await expect(
        page.getByRole("button", { name: /unread notifications/ })
      ).toBeVisible({ timeout: 10000 });
      await ctx.close();
    }
  });

  test("clicking bell opens popover", async ({ page }) => {
    await gotoDashboard(page, TEST_USERS.OWNER);
    const bellButton = page.getByRole("button", { name: /unread notifications/ });
    await bellButton.click();
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  });

  test("popover shows empty state or notification list", async ({ page }) => {
    await gotoDashboard(page, TEST_USERS.OWNER);
    const bellButton = page.getByRole("button", { name: /unread notifications/ });
    await bellButton.click();

    // Either "No notifications" empty state or notification items visible
    const noNotifications = page.getByText("No notifications");
    const notificationItems = page.locator('[role="button"]').filter({
      has: page.locator(".text-xs"),
    });
    const hasEmptyState = await noNotifications.isVisible().catch(() => false);
    const hasItems = (await notificationItems.count()) > 0;
    expect(hasEmptyState || hasItems).toBe(true);
  });

  test("bell shows unread count in sr-only text", async ({ page }) => {
    await gotoDashboard(page, TEST_USERS.OWNER);
    const srText = page.locator(".sr-only").filter({ hasText: /\d+ unread notifications/ });
    await expect(srText.first()).toBeAttached();
  });
});
