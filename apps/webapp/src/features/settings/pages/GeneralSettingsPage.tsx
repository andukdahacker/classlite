import { CenterSettingsPage } from "@/features/tenants/center-settings-page";

/**
 * General settings page - wraps existing CenterSettingsPage
 * for backward compatibility with Settings layout.
 */
export function GeneralSettingsPage() {
  return <CenterSettingsPage />;
}
