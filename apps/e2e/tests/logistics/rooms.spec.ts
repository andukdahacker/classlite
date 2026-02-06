import { test, expect, TEST_USERS, loginAs, getAppUrl } from "../../fixtures/auth.fixture";
import { waitForToast } from "../../utils/test-helpers";
import { closeAIAssistantDialog } from "../../utils/close-ai-assistant";

/**
 * Helper: navigate to rooms settings page and wait for content.
 */
async function gotoRooms(page: import("@playwright/test").Page, user: (typeof TEST_USERS)[keyof typeof TEST_USERS]) {
  await loginAs(page, user);
  await page.goto(getAppUrl("/settings/rooms"));
  await page.waitForLoadState("networkidle");
  await closeAIAssistantDialog(page);
  await page.getByRole("heading", { name: "Rooms" }).first().waitFor({ timeout: 15000 });
}

test.describe("Rooms - Page Structure", () => {
  test.beforeEach(async ({ page }) => {
    await gotoRooms(page, TEST_USERS.OWNER);
  });

  test("displays the Rooms heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Rooms" }).first()
    ).toBeVisible();
  });

  test("displays add room input and button", async ({ page }) => {
    await expect(
      page.getByPlaceholder("New room name (e.g., Room 101)")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Room" }).first()
    ).toBeVisible();
  });

  test("shows seeded E2E Room 101", async ({ page }) => {
    await expect(page.getByText("E2E Room 101").first()).toBeVisible();
  });
});

test.describe("Rooms - RBAC", () => {
  test("admin can access rooms page", async ({ page }) => {
    await gotoRooms(page, TEST_USERS.ADMIN);

    await expect(
      page.getByRole("heading", { name: "Rooms" }).first()
    ).toBeVisible();
  });

  test("teacher is redirected away from rooms", async ({ page }) => {
    await loginAs(page, TEST_USERS.TEACHER);
    await closeAIAssistantDialog(page);
    await page.goto(getAppUrl("/settings/rooms"));
    await page.waitForLoadState("networkidle");

    expect(page.url()).not.toContain("/settings/rooms");
  });

  test("student is redirected away from rooms", async ({ page }) => {
    await loginAs(page, TEST_USERS.STUDENT);
    await closeAIAssistantDialog(page);
    await page.goto(getAppUrl("/settings/rooms"));
    await page.waitForLoadState("networkidle");

    expect(page.url()).not.toContain("/settings/rooms");
  });
});

test.describe("Rooms - CRUD", () => {
  test.describe.configure({ mode: "serial" });

  const TEST_ROOM_NAME = `E2E Room ${Date.now().toString().slice(-6)}`;

  test.beforeEach(async ({ page }) => {
    await gotoRooms(page, TEST_USERS.OWNER);
  });

  test("creates a new room and shows toast", async ({ page }) => {
    const input = page.getByPlaceholder("New room name (e.g., Room 101)");
    await input.fill(TEST_ROOM_NAME);

    await page.getByRole("button", { name: "Add Room" }).first().click();
    await waitForToast(page, "Room created");

    await expect(page.getByText(TEST_ROOM_NAME).first()).toBeVisible();
  });

  test("enters inline edit mode and cancels", async ({ page }) => {
    // Find the test room row and click its edit (pencil) button
    const roomRow = page.locator("div.flex.items-center").filter({ hasText: TEST_ROOM_NAME });
    await roomRow.getByRole("button").first().click(); // Pencil icon
    await page.waitForTimeout(300);

    // Should show an input with the room name
    const editInput = roomRow.locator("input");
    await expect(editInput).toBeVisible();
    await expect(editInput).toHaveValue(TEST_ROOM_NAME);

    // Cancel editing (X button is the last button in the row)
    await roomRow.getByRole("button").last().click();
    await page.waitForTimeout(200);

    // Should show the room name as text again
    await expect(page.getByText(TEST_ROOM_NAME).first()).toBeVisible();
  });

  test("deletes room via AlertDialog", async ({ page }) => {
    const roomRow = page.locator("div.flex.items-center").filter({ hasText: TEST_ROOM_NAME });

    // Click the delete (trash) button - it's the last button when not editing
    await roomRow.getByRole("button").last().click();
    await page.waitForTimeout(300);

    // AlertDialog should appear
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible();
    await expect(alertDialog.getByText("Delete Room")).toBeVisible();

    // Confirm deletion
    await alertDialog.getByRole("button", { name: "Delete" }).click();
    await waitForToast(page, "Room deleted");

    // Room should no longer be visible
    await expect(page.getByText(TEST_ROOM_NAME)).toHaveCount(0);
  });
});

test.describe("Rooms - Add Room Button", () => {
  test("Add Room button is disabled when input is empty", async ({ page }) => {
    await gotoRooms(page, TEST_USERS.OWNER);

    const input = page.getByPlaceholder("New room name (e.g., Room 101)");
    await expect(input).toHaveValue("");

    await expect(
      page.getByRole("button", { name: "Add Room" }).first()
    ).toBeDisabled();
  });
});
