export const PERMISSION_DEFINITIONS = [
  { key: "dashboard.view", module: "Dashboard", action: "View" },
  { key: "invoices.view", module: "Invoices", action: "View" },
  { key: "invoices.create", module: "Invoices", action: "Create" },
  { key: "invoices.edit", module: "Invoices", action: "Edit" },
  { key: "invoices.delete", module: "Invoices", action: "Delete" },

  { key: "contacts.view", module: "Contacts", action: "View" },
  { key: "contacts.create", module: "Contacts", action: "Create" },
  { key: "contacts.edit", module: "Contacts", action: "Edit" },
  { key: "contacts.delete", module: "Contacts", action: "Delete" },

  { key: "accounts.view", module: "Chart of Accounts", action: "View" },
  { key: "accounts.create", module: "Chart of Accounts", action: "Create" },
  { key: "accounts.edit", module: "Chart of Accounts", action: "Edit" },
  { key: "accounts.delete", module: "Chart of Accounts", action: "Delete" },

  { key: "ledger.view", module: "General Ledger", action: "View" },
{ key: "ledger.create", module: "General Ledger", action: "Create" },
  { key: "reports.view", module: "Financial Reports", action: "View" },
  { key: "reports.export", module: "Financial Reports", action: "Export" },
  { key: "settings.profile.view", module: "Settings — Profile", action: "View" },
  { key: "settings.profile.edit", module: "Settings — Profile", action: "Edit" },
  { key: "settings.notifications.view", module: "Settings — Notifications", action: "View" },
  { key: "settings.notifications.edit", module: "Settings — Notifications", action: "Edit" },
  { key: "settings.appearance.view", module: "Settings — Appearance", action: "View" },
  { key: "settings.appearance.edit", module: "Settings — Appearance", action: "Edit" },
  { key: "settings.security.view", module: "Settings — Security", action: "View" },
  { key: "settings.security.edit", module: "Settings — Security", action: "Edit" },
  { key: "settings.company.view", module: "Settings — Company", action: "View" },
  { key: "settings.company.edit", module: "Settings — Company", action: "Edit" },
  { key: "settings.advanced.view", module: "Settings — Advanced", action: "View" },
  { key: "settings.advanced.export", module: "Settings — Advanced", action: "Export" },
  { key: "settings.advanced.import", module: "Settings — Advanced", action: "Import" },
  { key: "settings.advanced.deleteData", module: "Settings — Advanced", action: "Delete all data" },
  { key: "notifications.view", module: "Notifications", action: "View" },
] as const;

export type PermissionKey = (typeof PERMISSION_DEFINITIONS)[number]["key"];
export type PermissionMap = Record<PermissionKey, boolean>;

export function emptyPermissions(): PermissionMap {
  return Object.fromEntries(
    PERMISSION_DEFINITIONS.map(({ key }) => [key, false])
  ) as PermissionMap;
}

/** Only known, explicitly grantable permissions are accepted. Admin is never a permission key. */
export function normalizePermissions(value: unknown): PermissionMap {
  const result = emptyPermissions();
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  const input = value as Record<string, unknown>;
  for (const { key } of PERMISSION_DEFINITIONS) result[key] = input[key] === true;

  // Editing/export/import actions imply that the user can open and view that section.
const implications: Array<[PermissionKey, PermissionKey[]]> = [
  ["invoices.view", ["invoices.create", "invoices.edit", "invoices.delete"]],
  ["contacts.view", ["contacts.create", "contacts.edit", "contacts.delete"]],
  ["accounts.view", ["accounts.create", "accounts.edit", "accounts.delete"]],
  ["reports.view", ["reports.export"]],
  ["settings.profile.view", ["settings.profile.edit"]],
  ["settings.notifications.view", ["settings.notifications.edit"]],
  ["settings.appearance.view", ["settings.appearance.edit"]],
  ["settings.security.view", ["settings.security.edit"]],
  ["settings.company.view", ["settings.company.edit"]],
  [
    "settings.advanced.view",
    [
      "settings.advanced.export",
      "settings.advanced.import",
      "settings.advanced.deleteData",
    ],
  ],
];
  for (const [viewKey, actionKeys] of implications) {
    if (actionKeys.some((key) => result[key])) result[viewKey] = true;
  }
  return result;
}

export function hasAnySettingsPermission(value: Partial<Record<PermissionKey, boolean>>): boolean {
  return PERMISSION_DEFINITIONS.some(
    ({ key }) => key.startsWith("settings.") && value[key] === true
  );
}
