import { describe, it, expect } from "vitest";
import { hasPermission, hasAllPermissions, hasAnyPermission, roleLabels } from "./rbac";

describe("RBAC", () => {
  describe("admin", () => {
    it("全権限を持つ（削除・設定・ユーザー管理含む）", () => {
      expect(hasPermission("admin", "properties:delete")).toBe(true);
      expect(hasPermission("admin", "tenants:delete")).toBe(true);
      expect(hasPermission("admin", "contracts:delete")).toBe(true);
      expect(hasPermission("admin", "rent:delete")).toBe(true);
      expect(hasPermission("admin", "users:create")).toBe(true);
      expect(hasPermission("admin", "users:delete")).toBe(true);
      expect(hasPermission("admin", "settings:edit")).toBe(true);
    });
  });

  describe("staff", () => {
    it("作成・編集権限を持つ（全リソース）", () => {
      expect(hasPermission("staff", "properties:create")).toBe(true);
      expect(hasPermission("staff", "properties:edit")).toBe(true);
      expect(hasPermission("staff", "tenants:create")).toBe(true);
      expect(hasPermission("staff", "tenants:edit")).toBe(true);
      expect(hasPermission("staff", "contracts:create")).toBe(true);
      expect(hasPermission("staff", "rent:create")).toBe(true);
      expect(hasPermission("staff", "cases:create")).toBe(true);
      expect(hasPermission("staff", "expenses:create")).toBe(true);
      expect(hasPermission("staff", "owners:create")).toBe(true);
      expect(hasPermission("staff", "remittances:create")).toBe(true);
    });

    it("削除権限を一切持たない", () => {
      expect(hasPermission("staff", "properties:delete")).toBe(false);
      expect(hasPermission("staff", "tenants:delete")).toBe(false);
      expect(hasPermission("staff", "contracts:delete")).toBe(false);
      expect(hasPermission("staff", "rent:delete")).toBe(false);
      expect(hasPermission("staff", "cases:delete")).toBe(false);
      expect(hasPermission("staff", "expenses:delete")).toBe(false);
      expect(hasPermission("staff", "owners:delete")).toBe(false);
      expect(hasPermission("staff", "remittances:delete")).toBe(false);
    });

    it("ユーザー管理・設定編集権限を持たない", () => {
      expect(hasPermission("staff", "users:create")).toBe(false);
      expect(hasPermission("staff", "users:edit")).toBe(false);
      expect(hasPermission("staff", "users:delete")).toBe(false);
      expect(hasPermission("staff", "settings:edit")).toBe(false);
    });

    it("閲覧・エクスポートは可能", () => {
      expect(hasPermission("staff", "users:read")).toBe(true);
      expect(hasPermission("staff", "export:csv")).toBe(true);
    });
  });

  describe("viewer", () => {
    it("閲覧権限のみ持つ", () => {
      expect(hasPermission("viewer", "properties:read")).toBe(true);
      expect(hasPermission("viewer", "tenants:read")).toBe(true);
      expect(hasPermission("viewer", "settings:read")).toBe(true);
    });

    it("作成・編集・削除権限を一切持たない", () => {
      expect(hasPermission("viewer", "properties:create")).toBe(false);
      expect(hasPermission("viewer", "tenants:edit")).toBe(false);
      expect(hasPermission("viewer", "contracts:delete")).toBe(false);
      expect(hasPermission("viewer", "rent:create")).toBe(false);
      expect(hasPermission("viewer", "cases:edit")).toBe(false);
      expect(hasPermission("viewer", "expenses:delete")).toBe(false);
    });

    it("エクスポート権限を持たない", () => {
      expect(hasPermission("viewer", "export:csv")).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("全て満たす場合にtrue", () => {
      expect(hasAllPermissions("admin", ["properties:read", "properties:delete"])).toBe(true);
    });

    it("一つでも不足でfalse", () => {
      expect(hasAllPermissions("viewer", ["properties:read", "properties:edit"])).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("一つでも満たせばtrue", () => {
      expect(hasAnyPermission("viewer", ["properties:read", "properties:edit"])).toBe(true);
    });

    it("全て不足でfalse", () => {
      expect(hasAnyPermission("viewer", ["properties:create", "properties:edit"])).toBe(false);
    });
  });

  describe("roleLabels", () => {
    it("全ロールのラベルが定義されている", () => {
      expect(roleLabels.admin).toBe("管理者");
      expect(roleLabels.staff).toBe("スタッフ");
      expect(roleLabels.viewer).toBe("閲覧者");
    });
  });
});
