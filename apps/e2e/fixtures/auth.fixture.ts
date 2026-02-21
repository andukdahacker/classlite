import { test as base, Page } from "@playwright/test";

/**
 * E2E Test Center ID - must match seed-e2e.ts
 */
export const E2E_CENTER_ID = "e2e-test-center";

/**
 * Helper to construct URLs with the center ID prefix
 */
export function getAppUrl(path: string): string {
  // Paths like /dashboard, /settings/users, /courses, etc.
  // become /{centerId}/dashboard, /{centerId}/dashboard/settings/users, etc.
  if (path.startsWith("/dashboard")) {
    return `/${E2E_CENTER_ID}${path}`;
  }
  // Other paths get nested under dashboard
  return `/${E2E_CENTER_ID}/dashboard${path}`;
}

/**
 * User roles supported by the application.
 */
export type UserRole = "OWNER" | "ADMIN" | "TEACHER" | "STUDENT";

/**
 * Test user credentials for different roles.
 * These should match seeded test data in the database.
 */
export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
}

/**
 * Pre-configured test users for each role.
 * Override these via environment variables for different environments.
 */
export const TEST_USERS: Record<UserRole, TestUser> = {
  OWNER: {
    email: process.env.E2E_OWNER_EMAIL || "owner@test.classlite.com",
    password: process.env.E2E_OWNER_PASSWORD || "TestPassword123!",
    role: "OWNER",
    displayName: "Test Owner",
  },
  ADMIN: {
    email: process.env.E2E_ADMIN_EMAIL || "admin@test.classlite.com",
    password: process.env.E2E_ADMIN_PASSWORD || "TestPassword123!",
    role: "ADMIN",
    displayName: "Test Admin",
  },
  TEACHER: {
    email: process.env.E2E_TEACHER_EMAIL || "teacher@test.classlite.com",
    password: process.env.E2E_TEACHER_PASSWORD || "TestPassword123!",
    role: "TEACHER",
    displayName: "Test Teacher",
  },
  STUDENT: {
    email: process.env.E2E_STUDENT_EMAIL || "student@test.classlite.com",
    password: process.env.E2E_STUDENT_PASSWORD || "TestPassword123!",
    role: "STUDENT",
    displayName: "Test Student",
  },
};

/**
 * Reset login attempts for an email via the backend API.
 * This prevents lockouts during parallel E2E test execution.
 */
async function resetLoginAttempts(email: string): Promise<void> {
  const backendUrl = process.env.VITE_API_URL || "http://localhost:4000";
  try {
    await fetch(`${backendUrl}/api/v1/auth/login-attempt?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
  } catch {
    // Ignore errors - endpoint might not be available
  }
}


/**
 * Login as a specific user with retry logic.
 * Retries with exponential backoff + jitter to handle Firebase Auth emulator
 * rate-limiting during parallel test execution.
 * @param page - Playwright page object
 * @param user - Test user to log in as
 * @param retries - Number of retry attempts (default 5)
 */
export async function loginAs(page: Page, user: TestUser, retries = 5): Promise<void> {
  let lastError: Error | null = null;

  // Small random delay to avoid thundering herd when parallel tests start simultaneously
  await page.waitForTimeout(Math.floor(Math.random() * 1500));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await loginAsAttempt(page, user);
      return; // Success
    } catch (err) {
      lastError = err as Error;

      if (attempt < retries) {
        // Exponential backoff with random jitter
        const jitter = Math.floor(Math.random() * 2000);
        await page.waitForTimeout(3000 * attempt + jitter);
        // Reset backend login attempts
        await resetLoginAttempts(user.email);
        // Clear cookies/state to get a fresh session on retry
        await page.context().clearCookies();
      }
    }
  }

  throw lastError!;
}

/**
 * Single login attempt.
 */
async function loginAsAttempt(page: Page, user: TestUser): Promise<void> {
  // Reset any login attempt lockouts before logging in
  // This prevents flaky tests due to parallel execution
  await resetLoginAttempts(user.email);

  await page.goto("/sign-in");

  // Wait for either the login form or dashboard redirect (if already logged in)
  const emailInput = page.locator('input[type="email"]');
  try {
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
  } catch {
    // Login form didn't appear — if we're already on the dashboard, we're logged in
    if (page.url().includes("/dashboard")) {
      return;
    }
    throw new Error(
      `loginAs: Neither login form nor dashboard found. URL: ${page.url()}`
    );
  }

  // Fill in credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Click the login button
  await page.click('button[type="submit"]');

  // Wait for either dashboard redirect OR error message
  try {
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
  } catch {
    // If we didn't redirect to dashboard, check for error
    const errorText = await page.locator('.text-destructive').textContent().catch(() => null);
    const currentUrl = page.url();
    throw new Error(`Login failed for ${user.email}. Error: ${errorText || 'unknown'}. Current URL: ${currentUrl}`);
  }
}

/**
 * Log out the current user.
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Click on user menu (usually in the header)
  await page.click('[data-testid="user-menu"]');

  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to sign-in page
  await page.waitForURL("**/sign-in");
}

/**
 * Check if the user is logged in.
 * @param page - Playwright page object
 * @returns True if the user appears to be logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for elements that indicate logged-in state
  const userMenu = await page.$('[data-testid="user-menu"]');
  return userMenu !== null;
}

/**
 * Extended test type with role-specific page fixtures.
 */
export const test = base.extend<{
  ownerPage: Page;
  adminPage: Page;
  teacherPage: Page;
  studentPage: Page;
  authenticatedPage: Page;
  currentUser: TestUser;
}>({
  // Page fixture pre-logged-in as OWNER
  ownerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, TEST_USERS.OWNER);
    await use(page);
    await context.close();
  },

  // Page fixture pre-logged-in as ADMIN
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, TEST_USERS.ADMIN);
    await use(page);
    await context.close();
  },

  // Page fixture pre-logged-in as TEACHER
  teacherPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, TEST_USERS.TEACHER);
    await use(page);
    await context.close();
  },

  // Page fixture pre-logged-in as STUDENT
  studentPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, TEST_USERS.STUDENT);
    await use(page);
    await context.close();
  },

  // Generic authenticated page (defaults to OWNER)
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, TEST_USERS.OWNER);
    await use(page);
    await context.close();
  },

  // The current user being used (defaults to OWNER)
  currentUser: async ({}, use) => {
    await use(TEST_USERS.OWNER);
  },
});

export { expect } from "@playwright/test";
