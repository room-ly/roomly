// RBAC（Role-Based Access Control）権限管理

export type UserRole = "admin" | "manager" | "staff" | "viewer";

// アクション定義
export type Permission =
  | "properties:read"
  | "properties:create"
  | "properties:edit"
  | "properties:delete"
  | "units:read"
  | "units:create"
  | "units:edit"
  | "units:delete"
  | "tenants:read"
  | "tenants:create"
  | "tenants:edit"
  | "tenants:delete"
  | "contracts:read"
  | "contracts:create"
  | "contracts:edit"
  | "contracts:delete"
  | "rent:read"
  | "rent:create"
  | "rent:edit"
  | "rent:delete"
  | "maintenance:read"
  | "maintenance:create"
  | "maintenance:edit"
  | "maintenance:delete"
  | "inquiries:read"
  | "inquiries:create"
  | "inquiries:edit"
  | "inquiries:delete"
  | "expenses:read"
  | "expenses:create"
  | "expenses:edit"
  | "expenses:delete"
  | "owners:read"
  | "owners:create"
  | "owners:edit"
  | "owners:delete"
  | "remittances:read"
  | "remittances:create"
  | "remittances:edit"
  | "settings:read"
  | "settings:edit"
  | "users:read"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "export:csv"
  | "export:pdf";

// ロール別権限マトリクス
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // admin: 全権限
    "properties:read", "properties:create", "properties:edit", "properties:delete",
    "units:read", "units:create", "units:edit", "units:delete",
    "tenants:read", "tenants:create", "tenants:edit", "tenants:delete",
    "contracts:read", "contracts:create", "contracts:edit", "contracts:delete",
    "rent:read", "rent:create", "rent:edit", "rent:delete",
    "maintenance:read", "maintenance:create", "maintenance:edit", "maintenance:delete",
    "inquiries:read", "inquiries:create", "inquiries:edit", "inquiries:delete",
    "expenses:read", "expenses:create", "expenses:edit", "expenses:delete",
    "owners:read", "owners:create", "owners:edit", "owners:delete",
    "remittances:read", "remittances:create", "remittances:edit",
    "settings:read", "settings:edit",
    "users:read", "users:create", "users:edit", "users:delete",
    "export:csv", "export:pdf",
  ],
  manager: [
    // manager: 削除以外の全操作 + ユーザー管理なし
    "properties:read", "properties:create", "properties:edit",
    "units:read", "units:create", "units:edit",
    "tenants:read", "tenants:create", "tenants:edit",
    "contracts:read", "contracts:create", "contracts:edit",
    "rent:read", "rent:create", "rent:edit",
    "maintenance:read", "maintenance:create", "maintenance:edit",
    "inquiries:read", "inquiries:create", "inquiries:edit",
    "expenses:read", "expenses:create", "expenses:edit",
    "owners:read", "owners:create", "owners:edit",
    "remittances:read", "remittances:create", "remittances:edit",
    "settings:read",
    "users:read",
    "export:csv", "export:pdf",
  ],
  staff: [
    // staff: 日常業務のみ（作成・編集）
    "properties:read",
    "units:read",
    "tenants:read", "tenants:create", "tenants:edit",
    "contracts:read",
    "rent:read", "rent:create", "rent:edit",
    "maintenance:read", "maintenance:create", "maintenance:edit",
    "inquiries:read", "inquiries:create", "inquiries:edit",
    "expenses:read", "expenses:create",
    "owners:read",
    "remittances:read",
    "settings:read",
    "export:csv",
  ],
  viewer: [
    // viewer: 閲覧のみ
    "properties:read",
    "units:read",
    "tenants:read",
    "contracts:read",
    "rent:read",
    "maintenance:read",
    "inquiries:read",
    "expenses:read",
    "owners:read",
    "remittances:read",
    "settings:read",
  ],
};

// 権限チェック
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

// 複数権限チェック（全てを満たす必要あり）
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

// いずれかの権限チェック
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

// ロールラベル
export const roleLabels: Record<UserRole, string> = {
  admin: "管理者",
  manager: "マネージャー",
  staff: "スタッフ",
  viewer: "閲覧者",
};
