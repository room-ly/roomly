// RBAC（Role-Based Access Control）権限管理

export type UserRole = "admin" | "staff" | "viewer";

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
  | "cases:read"
  | "cases:create"
  | "cases:edit"
  | "cases:delete"
  | "expenses:read"
  | "expenses:create"
  | "expenses:edit"
  | "expenses:delete"
  | "expenses:approve"
  | "owners:read"
  | "owners:create"
  | "owners:edit"
  | "owners:delete"
  | "remittances:read"
  | "remittances:create"
  | "remittances:edit"
  | "remittances:delete"
  | "loans:read"
  | "loans:create"
  | "loans:edit"
  | "loans:delete"
  | "settings:read"
  | "settings:edit"
  | "users:read"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "export:csv"
  | "export:pdf";

// ロール別権限マトリクス
// admin : 全ての操作（読取/作成/編集/削除/設定/ユーザー管理）
// staff : 削除以外の全操作（読取/作成/編集）
// viewer: 閲覧のみ
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "properties:read", "properties:create", "properties:edit", "properties:delete",
    "units:read", "units:create", "units:edit", "units:delete",
    "tenants:read", "tenants:create", "tenants:edit", "tenants:delete",
    "contracts:read", "contracts:create", "contracts:edit", "contracts:delete",
    "rent:read", "rent:create", "rent:edit", "rent:delete",
    "cases:read", "cases:create", "cases:edit", "cases:delete",
    "expenses:read", "expenses:create", "expenses:edit", "expenses:delete", "expenses:approve",
    "owners:read", "owners:create", "owners:edit", "owners:delete",
    "remittances:read", "remittances:create", "remittances:edit", "remittances:delete",
    "loans:read", "loans:create", "loans:edit", "loans:delete",
    "settings:read", "settings:edit",
    "users:read", "users:create", "users:edit", "users:delete",
    "export:csv", "export:pdf",
  ],
  staff: [
    "properties:read", "properties:create", "properties:edit",
    "units:read", "units:create", "units:edit",
    "tenants:read", "tenants:create", "tenants:edit",
    "contracts:read", "contracts:create", "contracts:edit",
    "rent:read", "rent:create", "rent:edit",
    "cases:read", "cases:create", "cases:edit",
    "expenses:read", "expenses:create", "expenses:edit", "expenses:approve",
    "owners:read", "owners:create", "owners:edit",
    "remittances:read", "remittances:create", "remittances:edit",
    "loans:read", "loans:create", "loans:edit",
    "settings:read",
    "users:read",
    "export:csv", "export:pdf",
  ],
  viewer: [
    "properties:read",
    "units:read",
    "tenants:read",
    "contracts:read",
    "rent:read",
    "cases:read",
    "expenses:read",
    "owners:read",
    "remittances:read",
    "loans:read",
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
  staff: "スタッフ",
  viewer: "閲覧者",
};

// API/UI で使う有効ロール一覧
export const VALID_ROLES: UserRole[] = ["admin", "staff", "viewer"];
