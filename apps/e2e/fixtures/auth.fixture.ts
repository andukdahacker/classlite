import { test as base, Page, BrowserContext } from "@playwright/test";

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
 * Login as a specific user.
 * @param page - Playwright page object
 * @param user - Test user to log in as
 */
export async function loginAs(page: Page, user: TestUser): Promise<void> {
  await page.goto("/login");

  // Wait for the login form to be visible
  await page.waitForSelector('input[type="email"]');

  // Fill in credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Click the login button
  await page.click('button[type="submit"]');

  // Wait for navigation to complete (should redirect to dashboard)
  await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 });
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

  // Wait for redirect to login page
  await page.waitForURL("**/login");
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
