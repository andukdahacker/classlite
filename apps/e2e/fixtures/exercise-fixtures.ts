import type { Page } from "@playwright/test";
import { getAppUrl } from "./auth.fixture";
import { closeAIAssistantDialog } from "../utils/close-ai-assistant";
import { waitForToast } from "../utils/test-helpers";

/**
 * Generate a unique test name with timestamp to avoid collisions between test runs.
 */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

export type ExerciseSkill = "READING" | "LISTENING" | "WRITING" | "SPEAKING";

export interface CreateExerciseOptions {
  skill: ExerciseSkill;
  title?: string;
  instructions?: string;
  passageContent?: string;
}

export interface CreatedExercise {
  id: string;
  title: string;
  skill: ExerciseSkill;
}

const SKILL_BUTTON_TEXT: Record<ExerciseSkill, string> = {
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

/**
 * Get the auth token from the logged-in page's localStorage.
 * The webapp stores the Firebase ID token under the "token" key.
 */
async function getAuthToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem("token"));
  if (!token) throw new Error("No auth token found — is the user logged in?");
  return token;
}

function getBackendUrl(): string {
  return process.env.VITE_API_URL || "http://localhost:4000";
}

/**
 * Navigate to the exercises page and wait for it to load.
 */
export async function gotoExercises(page: Page): Promise<void> {
  await page.goto(getAppUrl("/exercises"));
  await page.waitForLoadState("networkidle");
  await closeAIAssistantDialog(page);
  await page.getByRole("heading", { name: "Exercises" }).first().waitFor();
}

/**
 * Create a test exercise via the UI.
 * Navigates to create page, selects skill, fills form, saves draft.
 * Returns the created exercise info with ID extracted from URL.
 */
export async function createExerciseViaUI(
  page: Page,
  options: CreateExerciseOptions
): Promise<CreatedExercise> {
  const title = options.title ?? uniqueName(`E2E ${options.skill}`);

  // Navigate to exercise creation
  await gotoExercises(page);
  await page.getByRole("button", { name: "Create Exercise" }).click();

  // Wait for skill selector page
  await page.getByRole("heading", { name: "Select Exercise Skill" }).waitFor();

  // Click the skill button (button elements containing skill text)
  await page
    .locator("button")
    .filter({ hasText: SKILL_BUTTON_TEXT[options.skill] })
    .first()
    .click();

  // Wait for exercise creation API call and redirect to editor
  await page.waitForURL(/.*\/exercises\/[^/]+\/edit/);
  await waitForToast(page, "Exercise created");

  // Extract exercise ID from URL
  const url = page.url();
  const match = url.match(/exercises\/([^/]+)\/edit/);
  const id = match?.[1] ?? "";

  // Fill title
  await page.locator("#exercise-title").clear();
  await page.locator("#exercise-title").fill(title);

  // Fill instructions if provided
  if (options.instructions) {
    await page.locator("#exercise-instructions").fill(options.instructions);
  }

  // Fill passage content for Reading/Listening
  if (
    options.passageContent &&
    (options.skill === "READING" || options.skill === "LISTENING")
  ) {
    const passageLabel = options.skill === "LISTENING" ? "Transcript" : "Passage";
    await page.getByLabel(passageLabel).fill(options.passageContent);
  }

  // Save draft
  await page.getByRole("button", { name: "Save Draft" }).click();
  await waitForToast(page, "Draft saved");

  return { id, title, skill: options.skill };
}

/**
 * Create a test exercise via the backend API (faster setup).
 * Requires the page to be logged in so we can extract the auth token.
 */
export async function createExerciseViaAPI(
  page: Page,
  options: CreateExerciseOptions
): Promise<CreatedExercise> {
  const title = options.title ?? uniqueName(`E2E ${options.skill}`);
  const token = await getAuthToken(page);

  const response = await page.request.post(
    `${getBackendUrl()}/api/v1/exercises`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { title, skill: options.skill },
    }
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to create exercise via API: ${response.status()} ${body}`
    );
  }

  const body = await response.json();
  const exerciseData = body.data ?? body;

  return {
    id: exerciseData.id,
    title: exerciseData.title ?? title,
    skill: options.skill,
  };
}

/**
 * Publish an exercise via API.
 */
export async function publishExerciseViaAPI(
  page: Page,
  exerciseId: string
): Promise<void> {
  const token = await getAuthToken(page);
  const response = await page.request.post(
    `${getBackendUrl()}/api/v1/exercises/${exerciseId}/publish`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok()) {
    throw new Error(`Failed to publish exercise: ${response.status()}`);
  }
}

/**
 * Archive an exercise via API.
 */
export async function archiveExerciseViaAPI(
  page: Page,
  exerciseId: string
): Promise<void> {
  const token = await getAuthToken(page);
  const response = await page.request.post(
    `${getBackendUrl()}/api/v1/exercises/${exerciseId}/archive`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok()) {
    throw new Error(`Failed to archive exercise: ${response.status()}`);
  }
}

/**
 * Restore an archived exercise via API.
 */
export async function restoreExerciseViaAPI(
  page: Page,
  exerciseId: string
): Promise<void> {
  const token = await getAuthToken(page);
  const response = await page.request.post(
    `${getBackendUrl()}/api/v1/exercises/${exerciseId}/restore`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok()) {
    throw new Error(`Failed to restore exercise: ${response.status()}`);
  }
}

/**
 * Duplicate an exercise via API.
 */
export async function duplicateExerciseViaAPI(
  page: Page,
  exerciseId: string
): Promise<CreatedExercise> {
  const token = await getAuthToken(page);
  const response = await page.request.post(
    `${getBackendUrl()}/api/v1/exercises/${exerciseId}/duplicate`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok()) {
    throw new Error(`Failed to duplicate exercise: ${response.status()}`);
  }
  const body = await response.json();
  const data = body.data ?? body;
  return { id: data.id, title: data.title, skill: data.skill };
}

/**
 * Clean up a test exercise by deleting it via API.
 * Silently ignores errors (exercise may already be deleted).
 */
export async function cleanupExercise(
  page: Page,
  exerciseId: string
): Promise<void> {
  try {
    const token = await getAuthToken(page);
    await page.request.delete(
      `${getBackendUrl()}/api/v1/exercises/${exerciseId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Clean up multiple test exercises.
 */
export async function cleanupExercises(
  page: Page,
  exerciseIds: string[]
): Promise<void> {
  for (const id of exerciseIds) {
    await cleanupExercise(page, id);
  }
}
