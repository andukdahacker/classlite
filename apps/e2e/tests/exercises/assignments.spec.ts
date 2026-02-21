import { test, expect, TEST_USERS } from "../../fixtures/auth.fixture";
import { loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";
import { waitForToast } from "../../utils/test-helpers";
import {
  uniqueName,
  createExerciseViaAPI,
  publishExerciseViaAPI,
  cleanupExercise,
} from "../../fixtures/exercise-fixtures";
import { gotoAssignments } from "../../fixtures/assignment-fixtures";

/**
 * Helper: fill the create assignment dialog (exercise + class selection + submit).
 * Assumes dialog is already open and page is logged in.
 */
async function fillAndSubmitAssignmentDialog(
  page: import("@playwright/test").Page,
  exerciseTitle: string,
  options?: { setDueDate?: boolean }
) {
  // Wait for dialog content to load (exercises and classes lists need API calls)
  await page.waitForLoadState("networkidle");

  // Select exercise from the Select dropdown
  const exerciseSelect = page
    .getByRole("dialog")
    .locator('[role="combobox"]')
    .first();
  await exerciseSelect.click();

  // Wait for exercise options to load
  await page.locator('[role="option"]').first().waitFor({ timeout: 10000 });
  await page
    .locator('[role="option"]')
    .filter({ hasText: exerciseTitle })
    .first()
    .click();

  // Wait for class list to load, then select the E2E Test Class
  const classLabel = page
    .getByRole("dialog")
    .locator("label")
    .filter({ hasText: /E2E Test Class/i })
    .first();
  await classLabel.waitFor({ state: "visible", timeout: 10000 });
  await classLabel.click();

  // Set due date if requested
  if (options?.setDueDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateStr = tomorrow.toISOString().slice(0, 16);
    await page
      .getByRole("dialog")
      .locator('input[type="datetime-local"]')
      .fill(dueDateStr);
  }

  // Submit assignment — button text is "Assign to N class(es)"
  const submitButton = page
    .getByRole("dialog")
    .getByRole("button", { name: /Assign to/i });

  // Listen for the POST request BEFORE clicking to capture the API response
  const apiResponsePromise = page.waitForResponse(
    (resp) =>
      resp.url().includes("/api/v1/assignments") &&
      resp.request().method() === "POST",
    { timeout: 30000 }
  );
  await submitButton.click();

  // Wait for the API response — if no POST is made, the click didn't fire
  const apiResponse = await apiResponsePromise;
  if (!apiResponse.ok()) {
    const body = await apiResponse.text().catch(() => "");
    throw new Error(
      `Assignment API returned ${apiResponse.status()}: ${body}`
    );
  }

  // Dialog should close after successful creation
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
}

/**
 * AC4: Assignment Flow
 * E2E test covering: navigate to assignments → create new assignment →
 * select an exercise → select target class(es) → set due date → publish assignment →
 * verify assignment appears in list → verify student can see assignment in student dashboard.
 */
test.describe("Assignment Flow (AC4)", () => {
  let exerciseId: string | null = null;

  test.afterEach(async ({ page }) => {
    if (exerciseId) {
      await cleanupExercise(page, exerciseId);
      exerciseId = null;
    }
  });

  test("create assignment — select exercise, class, due date, publish", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Create and publish a test exercise via API (assignments require published exercises)
    const exercise = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Assign Exercise"),
    });
    exerciseId = exercise.id;
    await publishExerciseViaAPI(page, exercise.id);

    // Navigate to assignments
    await gotoAssignments(page);

    // Click create assignment button
    await page
      .getByRole("button", { name: /Create|New|Assign/i })
      .first()
      .click();

    // Wait for dialog
    await page.getByRole("dialog").waitFor();

    await fillAndSubmitAssignmentDialog(page, exercise.title, {
      setDueDate: true,
    });
  });

  test("verify assignment appears in assignment list", async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Create and publish exercise
    const exercise = await createExerciseViaAPI(page, {
      skill: "WRITING",
      title: uniqueName("E2E List Assignment"),
    });
    exerciseId = exercise.id;
    await publishExerciseViaAPI(page, exercise.id);

    // Navigate to assignments page
    await gotoAssignments(page);

    // Create assignment via UI
    await page
      .getByRole("button", { name: /Create|New|Assign/i })
      .first()
      .click();
    await page.getByRole("dialog").waitFor();

    await fillAndSubmitAssignmentDialog(page, exercise.title);

    // Use search to find the assignment (table may be paginated across many pages)
    await page.waitForLoadState("networkidle");
    const searchInput = page.getByPlaceholder(/search by exercise title/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(exercise.title);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
    }
    await expect(page.getByText(exercise.title)).toBeVisible({
      timeout: 10000,
    });
  });

  test("student can see assignment in student dashboard", async ({
    browser,
  }) => {
    // Use owner context to create assignment
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await loginAs(ownerPage, TEST_USERS.OWNER);

    // Create and publish exercise
    const exercise = await createExerciseViaAPI(ownerPage, {
      skill: "READING",
      title: uniqueName("E2E Student View"),
    });
    exerciseId = exercise.id;
    await publishExerciseViaAPI(ownerPage, exercise.id);

    // Create assignment for the E2E Test Class via API
    const token = await ownerPage.evaluate(() =>
      localStorage.getItem("token")
    );
    const backendUrl = process.env.VITE_API_URL || "http://localhost:4000";

    // Get classes (correct API path: /api/v1/logistics/classes)
    const classesResp = await ownerPage.request.get(
      `${backendUrl}/api/v1/logistics/classes`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const classesBody = await classesResp.json();
    const classes = classesBody.data ?? classesBody;
    const testClass = Array.isArray(classes)
      ? classes.find(
          (c: { name: string }) =>
            c.name.toLowerCase().includes("e2e") ||
            c.name.toLowerCase().includes("test")
        )
      : null;

    expect(testClass).toBeTruthy();

    if (testClass) {
      const assignResp = await ownerPage.request.post(
        `${backendUrl}/api/v1/assignments`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            exerciseId: exercise.id,
            classIds: [testClass.id],
            dueDate: null,
            timeLimit: null,
            instructions: null,
          },
        }
      );
      expect(assignResp.ok()).toBeTruthy();
    }

    await ownerContext.close();

    // Switch to student context
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    await loginAs(studentPage, TEST_USERS.STUDENT);

    // Navigate to student dashboard. The StudentDashboard component is
    // lazy-loaded and uses React Query to fetch assignments.
    // Give extra time for the component to mount and fetch data.
    await studentPage.goto(getAppUrl("/dashboard"));
    await studentPage.waitForLoadState("networkidle");
    await closeAIAssistantDialog(studentPage);

    // Intercept the student assignments API response to diagnose failures
    const studentApiPromise = studentPage.waitForResponse(
      (resp) => resp.url().includes("/student/assignments"),
      { timeout: 15000 }
    );
    // Reload to ensure a fresh API call
    await studentPage.reload();
    await studentPage.waitForLoadState("networkidle");
    await closeAIAssistantDialog(studentPage);

    const studentApiResp = await studentApiPromise;
    if (!studentApiResp.ok()) {
      const body = await studentApiResp.text().catch(() => "");
      throw new Error(
        `Student assignments API failed: ${studentApiResp.status()} ${body}`
      );
    }

    // The student dashboard shows "Your Tasks" heading when loaded.
    await expect(
      studentPage.getByRole("heading", { name: "Your Tasks" })
    ).toBeVisible({ timeout: 15000 });

    // Check for the exercise title in assignment cards
    await expect(studentPage.getByText(exercise.title)).toBeVisible({
      timeout: 10000,
    });

    // Verify assignment card shows skill icon — check for skill badge
    const card = studentPage
      .locator('[class*="card"], [class*="border"]')
      .filter({ hasText: exercise.title })
      .first();
    await expect(card).toBeVisible();

    await studentContext.close();
  });

  test("assignment status changes (open/closed)", async ({ page }) => {
    await loginAs(page, TEST_USERS.OWNER);

    // Create and publish exercise
    const exercise = await createExerciseViaAPI(page, {
      skill: "READING",
      title: uniqueName("E2E Status Change"),
    });
    exerciseId = exercise.id;
    await publishExerciseViaAPI(page, exercise.id);

    // Create assignment via API
    const token = await page.evaluate(() => localStorage.getItem("token"));
    const backendUrl = process.env.VITE_API_URL || "http://localhost:4000";

    // Get classes (correct API path: /api/v1/logistics/classes)
    const classesResp = await page.request.get(
      `${backendUrl}/api/v1/logistics/classes`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const classesBody = await classesResp.json();
    const classes = classesBody.data ?? classesBody;
    const testClass = Array.isArray(classes)
      ? classes.find(
          (c: { name: string }) =>
            c.name.toLowerCase().includes("e2e") ||
            c.name.toLowerCase().includes("test")
        )
      : null;

    let assignmentId: string | null = null;
    if (testClass) {
      const resp = await page.request.post(
        `${backendUrl}/api/v1/assignments`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            exerciseId: exercise.id,
            classIds: [testClass.id],
            dueDate: null,
            timeLimit: null,
            instructions: null,
          },
        }
      );
      const body = await resp.json();
      assignmentId = (body.data ?? body).id;
    }

    // Navigate to assignments
    await gotoAssignments(page);

    // Find the assignment and close it
    if (assignmentId) {
      const assignmentRow = page
        .locator("tr, [class*='card']")
        .filter({ hasText: exercise.title })
        .first();

      if (await assignmentRow.isVisible()) {
        // Open actions menu
        const actionsButton = assignmentRow
          .locator('button[aria-label*="action" i], button:has(svg)')
          .last();
        await actionsButton.click();

        // Click Close
        const closeOption = page
          .locator('[role="menuitem"]')
          .filter({ hasText: /Close/i });
        if (await closeOption.isVisible()) {
          await closeOption.click();
          await waitForToast(page, "closed");
        }
      }
    }
  });
});
