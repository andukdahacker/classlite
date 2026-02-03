export interface SettingsTabConfig {
  id: string;
  label: string;
  path: string;
  order: number;
  disabled?: boolean;
  badge?: string;
}

export const settingsTabs: SettingsTabConfig[] = [
  { id: "general", label: "General", path: "", order: 1 },
  { id: "users", label: "Users", path: "users", order: 2 },
  { id: "integrations", label: "Integrations", path: "integrations", order: 3 },
  { id: "privacy", label: "Privacy", path: "privacy", order: 4 },
  { id: "billing", label: "Billing", path: "billing", order: 5, disabled: true, badge: "Coming Soon" },
];
