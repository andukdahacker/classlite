import type { Page } from "@playwright/test";
import { getAppUrl } from "./auth.fixture";
import { closeAIAssistantDialog } from "../utils/close-ai-assistant";

/**
 * Get the auth token from the logged-in page's localStorage.
 */
async function getAuthToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem("token"));
  if (!token) throw new Error("No auth token found — is the user logged in?");
  return token;
}

function getBackendUrl(): string {
  return process.env.VITE_API_URL || "http://localhost:4000";
}

export interface CreateAssignmentOptions {
  exerciseId: string;
  classIds?: string[];
  studentIds?: string[];
  dueDate?: string | null;
  timeLimit?: number | null;
  instructions?: string | null;
}

export interface CreatedAssignment {
  id: string;
  exerciseId: string;
}

/**
 * Navigate to the assignments page and wait for it to load.
 */
export async function gotoAssignments(page: Page): Promise<void> {
  await page.goto(getAppUrl("/assignments"));
  await page.waitForLoadState("networkidle");
  await closeAIAssistantDialog(page);
  await page.getByRole("heading", { name: "Assignments" }).first().waitFor();
}

/**
 * Create a test assignment via the UI.
 * Opens the create dialog, selects exercise, target class(es), sets due date, and submits.
 */
export async function createAssignmentViaUI(
  page: Page,
  options: {
    exerciseTitle: string;
    className: string;
    dueDate?: string;
    instructions?: string;
  }
): Promise<void> {
  await gotoAssignments(page);

  // Click create button
  await page.getByRole("button", { name: /Create|Assign/i }).first().click();

  // Wait for dialog
  await page.getByRole("dialog").waitFor();

  // Select exercise from dropdown
  const exerciseSelect = page
    .getByRole("dialog")
    .locator('[role="combobox"]')
    .first();
  await exerciseSelect.click();
  await page
    .locator('[role="option"]')
    .filter({ hasText: options.exerciseTitle })
    .first()
    .click();

  // Select class checkbox
  await page
    .getByRole("dialog")
    .locator("label")
    .filter({ hasText: options.className })
    .click();

  // Set due date if provided
  if (options.dueDate) {
    await page
      .getByRole("dialog")
      .locator('input[type="datetime-local"]')
      .fill(options.dueDate);
  }

  // Fill instructions if provided
  if (options.instructions) {
    await page
      .getByRole("dialog")
      .getByLabel("Instructions")
      .fill(options.instructions);
  }

  // Submit
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Assign to/i })
    .click();

  // Wait for success
  await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
}

/**
 * Create a test assignment via the backend API (faster setup).
 */
export async function createAssignmentViaAPI(
  page: Page,
  options: CreateAssignmentOptions
): Promise<CreatedAssignment> {
  const token = await getAuthToken(page);

  const response = await page.request.post(
    `${getBackendUrl()}/api/v1/assignments`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        exerciseId: options.exerciseId,
        classIds: options.classIds,
        studentIds: options.studentIds,
        dueDate: options.dueDate ?? null,
        timeLimit: options.timeLimit ?? null,
        instructions: options.instructions ?? null,
      },
    }
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to create assignment via API: ${response.status()} ${body}`
    );
  }

  const body = await response.json();
  const data = body.data ?? body;
  return { id: data.id, exerciseId: options.exerciseId };
}

/**
 * Clean up a test assignment by deleting it via API.
 */
export async function cleanupAssignment(
  page: Page,
  assignmentId: string
): Promise<void> {
  try {
    const token = await getAuthToken(page);
    await page.request.delete(
      `${getBackendUrl()}/api/v1/assignments/${assignmentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Clean up multiple test assignments.
 */
export async function cleanupAssignments(
  page: Page,
  assignmentIds: string[]
): Promise<void> {
  for (const id of assignmentIds) {
    await cleanupAssignment(page, id);
  }
}
