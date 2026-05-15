"use client";

import { useAuth } from "@/lib/auth-context";
import { hasPermission, hasAnyPermission, type Permission, type UserRole } from "@/lib/rbac";

interface RoleGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  mode?: "all" | "any"; // "any"がデフォルト
  fallback?: React.ReactNode;
}

// 権限に基づいてUIの表示/非表示を制御
export default function RoleGuard({
  children,
  permission,
  permissions,
  mode = "any",
  fallback = null,
}: RoleGuardProps) {
  const { user } = useAuth();
  const role = (user?.role ?? "viewer") as UserRole;

  if (permission) {
    return hasPermission(role, permission) ? <>{children}</> : <>{fallback}</>;
  }

  if (permissions) {
    const hasAccess =
      mode === "all"
        ? permissions.every((p) => hasPermission(role, p))
        : hasAnyPermission(role, permissions);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  return <>{children}</>;
}
