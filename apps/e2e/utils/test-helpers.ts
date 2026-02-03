import { Page, expect } from "@playwright/test";

/**
 * Wait for a toast notification to appear and optionally verify its content.
 * @param page - Playwright page object
 * @param text - Optional text to match in the toast
 */
export async function waitForToast(
  page: Page,
  text?: string
): Promise<void> {
  const toastSelector = '[data-sonner-toast]';
  await page.waitForSelector(toastSelector, { timeout: 5000 });

  if (text) {
    await expect(page.locator(toastSelector)).toContainText(text);
  }
}

/**
 * Dismiss any visible toast notifications.
 * @param page - Playwright page object
 */
export async function dismissToasts(page: Page): Promise<void> {
  const toasts = await page.$$('[data-sonner-toast] button[aria-label="Close"]');
  for (const toast of toasts) {
    await toast.click().catch(() => {
      // Ignore if toast already dismissed
    });
  }
}

/**
 * Wait for a loading state to complete.
 * @param page - Playwright page object
 * @param selector - Selector for loading indicator
 */
export async function waitForLoadingComplete(
  page: Page,
  selector = '[data-loading="true"]'
): Promise<void> {
  // Wait for loading to appear (if it does)
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
  } catch {
    // Loading indicator might not appear for fast operations
    return;
  }

  // Wait for loading to disappear
  await page.waitForSelector(selector, { state: "hidden", timeout: 30000 });
}

/**
 * Fill a form field by label text.
 * @param page - Playwright page object
 * @param label - Label text for the field
 * @param value - Value to fill
 */
export async function fillFieldByLabel(
  page: Page,
  label: string,
  value: string
): Promise<void> {
  const field = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") input`);
  await field.fill(value);
}

/**
 * Select an option from a dropdown by label.
 * @param page - Playwright page object
 * @param label - Label text for the dropdown
 * @param option - Option text to select
 */
export async function selectByLabel(
  page: Page,
  label: string,
  option: string
): Promise<void> {
  // Click the trigger to open dropdown
  const trigger = page.locator(`label:has-text("${label}")`).locator("..").locator('[role="combobox"]');
  await trigger.click();

  // Select the option
  await page.click(`[role="option"]:has-text("${option}")`);
}

/**
 * Check if an element is visible on the page.
 * @param page - Playwright page object
 * @param selector - Selector to check
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: "visible", timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current URL path.
 * @param page - Playwright page object
 */
export function getUrlPath(page: Page): string {
  const url = new URL(page.url());
  return url.pathname;
}

/**
 * Wait for navigation to a specific path.
 * @param page - Playwright page object
 * @param path - Path to wait for (supports regex)
 */
export async function waitForPath(
  page: Page,
  path: string | RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const pattern = typeof path === "string" ? new RegExp(path) : path;
  await page.waitForURL(pattern, { timeout: options.timeout || 10000 });
}

/**
 * Take a screenshot with a descriptive name.
 * @param page - Playwright page object
 * @param name - Name for the screenshot
 */
export async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `./test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Check for accessibility violations (requires @axe-core/playwright).
 * This is a placeholder - implement when axe-core is added.
 */
export async function checkAccessibility(
  _page: Page,
  _options?: { exclude?: string[] }
): Promise<void> {
  // TODO: Implement with @axe-core/playwright
  // const violations = await new AxeBuilder({ page })
  //   .exclude(options?.exclude || [])
  //   .analyze();
  // expect(violations.violations).toEqual([]);
}
