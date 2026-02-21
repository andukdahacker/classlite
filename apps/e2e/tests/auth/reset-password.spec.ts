import { test, expect, TEST_USERS } from "../../fixtures/auth.fixture";
import { waitForToast } from "../../utils/test-helpers";

const FIREBASE_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || "claite-87848";

/**
 * Generate a password-reset OOB code via the Firebase Auth Emulator REST API.
 *
 * 1. POST /identitytoolkit.googleapis.com/v1/accounts:sendOobCode — triggers reset email
 * 2. GET  /emulator/v1/projects/{projectId}/oobCodes — retrieves the oobCode
 */
async function generatePasswordResetOobCode(email: string): Promise<string> {
  // Step 1: Trigger the password-reset email
  const sendRes = await fetch(
    `http://${FIREBASE_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=fake-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email,
      }),
    }
  );
  if (!sendRes.ok) {
    const body = await sendRes.text();
    throw new Error(`sendOobCode failed: ${sendRes.status} ${body}`);
  }

  // Step 2: Retrieve the OOB code from the emulator
  const oobRes = await fetch(
    `http://${FIREBASE_EMULATOR_HOST}/emulator/v1/projects/${FIREBASE_PROJECT_ID}/oobCodes`
  );
  if (!oobRes.ok) {
    const body = await oobRes.text();
    throw new Error(`getOobCodes failed: ${oobRes.status} ${body}`);
  }
  const oobData = await oobRes.json();
  const codes: Array<{ email: string; oobCode: string; requestType: string }> =
    oobData.oobCodes || [];

  // Find the most recent PASSWORD_RESET code for this email
  const resetCode = [...codes]
    .reverse()
    .find(
      (c) =>
        c.email === email && c.requestType === "PASSWORD_RESET"
    );

  if (!resetCode) {
    throw new Error(`No PASSWORD_RESET oobCode found for ${email}`);
  }

  return resetCode.oobCode;
}

/**
 * Restore a user's password back to the original via emulator REST API.
 */
async function restorePassword(
  email: string,
  currentPassword: string,
  originalPassword: string
): Promise<void> {
  // Sign in with the new (current) password to get an idToken
  const signInRes = await fetch(
    `http://${FIREBASE_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: currentPassword, returnSecureToken: true }),
    }
  );
  if (!signInRes.ok) return; // Best-effort cleanup
  const { idToken } = await signInRes.json();

  // Update the password back to the original
  await fetch(
    `http://${FIREBASE_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:update?key=fake-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, password: originalPassword, returnSecureToken: false }),
    }
  );
}

test.describe("Reset Password Page", () => {
  test("shows invalid token error for missing token", async ({ page }) => {
    // The page expects mode=resetPassword and oobCode parameters
    await page.goto("/reset-password");

    // Should show error about missing/invalid token
    // The UI shows "Invalid link" as title and error message in description
    await expect(
      page.locator('text="Invalid link"').or(
        page.locator('text="Missing password reset code"')
      ).or(
        page.locator('text="Invalid password reset link"')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows invalid token error for malformed token", async ({ page }) => {
    // The page uses mode=resetPassword and oobCode, not token
    await page.goto("/reset-password?mode=resetPassword&oobCode=invalid-token-123");

    // Should show error about invalid token
    // Wait for the validation to complete (loading state first, then error)
    await expect(
      page.locator('text="Invalid link"').or(
        page.locator('text="Link expired"')
      ).or(
        page.locator('text="invalid"')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test.describe("With Valid Token", () => {
    test("displays reset password form with valid token", async ({ page }) => {
      const oobCode = await generatePasswordResetOobCode(TEST_USERS.OWNER.email);
      await page.goto(`/reset-password?mode=resetPassword&oobCode=${oobCode}`);

      // Verify "Create new password" title
      await expect(
        page.locator('text="Create new password"')
      ).toBeVisible({ timeout: 10000 });

      // Verify two password inputs with placeholder
      const passwordInputs = page.locator('input[placeholder="••••••••"]');
      await expect(passwordInputs.first()).toBeVisible();
      await expect(passwordInputs.nth(1)).toBeVisible();

      // Verify "Reset password" submit button
      await expect(
        page.locator('button').filter({ hasText: 'Reset password' })
      ).toBeVisible();
    });

    test("password requirements are enforced", async ({ page }) => {
      const oobCode = await generatePasswordResetOobCode(TEST_USERS.OWNER.email);
      await page.goto(`/reset-password?mode=resetPassword&oobCode=${oobCode}`);

      await expect(page.locator('text="Create new password"')).toBeVisible({ timeout: 10000 });

      // Enter weak password in both fields
      const passwordInputs = page.locator('input[placeholder="••••••••"]');
      await passwordInputs.first().fill("weak");
      await passwordInputs.nth(1).fill("weak");

      // Submit
      await page.locator('button').filter({ hasText: 'Reset password' }).click();

      // Verify client-side Zod validation error (oobCode NOT consumed)
      await expect(
        page.locator('text="Password must be at least 8 characters"')
      ).toBeVisible();
    });

    test("passwords must match", async ({ page }) => {
      const oobCode = await generatePasswordResetOobCode(TEST_USERS.OWNER.email);
      await page.goto(`/reset-password?mode=resetPassword&oobCode=${oobCode}`);

      await expect(page.locator('text="Create new password"')).toBeVisible({ timeout: 10000 });

      // Enter mismatched passwords
      const passwordInputs = page.locator('input[placeholder="••••••••"]');
      await passwordInputs.first().fill("ValidPassword1");
      await passwordInputs.nth(1).fill("DifferentPassword1");

      // Submit
      await page.locator('button').filter({ hasText: 'Reset password' }).click();

      // Verify passwords don't match error
      await expect(
        page.locator("text=\"Passwords don't match\"")
      ).toBeVisible();
    });

    test("successful reset redirects to sign-in with success message", async ({ page }) => {
      const newPassword = "NewResetPassword1!";
      const oobCode = await generatePasswordResetOobCode(TEST_USERS.OWNER.email);
      await page.goto(`/reset-password?mode=resetPassword&oobCode=${oobCode}`);

      await expect(page.locator('text="Create new password"')).toBeVisible({ timeout: 10000 });

      // Enter matching valid passwords
      const passwordInputs = page.locator('input[placeholder="••••••••"]');
      await passwordInputs.first().fill(newPassword);
      await passwordInputs.nth(1).fill(newPassword);

      // Submit
      await page.locator('button').filter({ hasText: 'Reset password' }).click();

      // Verify redirect to sign-in (URL includes ?reset=true)
      await page.waitForURL(/.*sign-in/, { timeout: 15000 });

      // Verify success toast
      await waitForToast(page, "Password updated successfully");

      // Cleanup: restore original password
      await restorePassword(
        TEST_USERS.OWNER.email,
        newPassword,
        TEST_USERS.OWNER.password
      );
    });
  });
});
