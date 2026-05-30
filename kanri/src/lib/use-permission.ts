"use client";

import { useAuth } from "./auth-context";
import { hasPermission, type Permission, type UserRole } from "./rbac";

/**
 * 現在のユーザーが指定されたパーミッションを持っているかを返す。
 * UI側でボタン/メニューの表示制御に使う。
 *
 * 使い方:
 *   const canCreate = usePermission("properties:create");
 *   {canCreate && <button>追加</button>}
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return hasPermission(user.role as UserRole, permission);
}

export function useRole(): UserRole | null {
  const { user } = useAuth();
  return (user?.role as UserRole) ?? null;
}
