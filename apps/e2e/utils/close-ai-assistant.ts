import type { Page } from "@playwright/test";

/**
 * Helper to close the AI Assistant sheet/dialog if it's open.
 * The AI Assistant is a Sheet component that opens by default on narrower viewports.
 */
export async function closeAIAssistantDialog(page: Page) {
  // Only try to close if we're on a dashboard page (has the AI Assistant)
  if (!page.url().includes("dashboard")) {
    return;
  }

  // Wait for any animations to complete
  await page.waitForTimeout(500);

  // Try to close via the sheet overlay (clicking outside closes it)
  const sheetOverlay = page.locator('[data-slot="sheet-overlay"][data-state="open"]');
  if (await sheetOverlay.count() > 0) {
    // Click on the overlay to close the sheet
    await sheetOverlay.click({ force: true, position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
  }

  // Also try pressing Escape as a fallback
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}
