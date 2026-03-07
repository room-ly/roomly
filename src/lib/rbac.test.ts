import { describe, it, expect } from "vitest";
import { hasPermission, hasAllPermissions, hasAnyPermission, roleLabels } from "./rbac";

describe("RBAC", () => {
  describe("admin", () => {
    it("全権限を持つ", () => {
      expect(hasPermission("admin", "properties:delete")).toBe(true);
      expect(hasPermission("admin", "users:delete")).toBe(true);
      expect(hasPermission("admin", "settings:edit")).toBe(true);
    });
  });

  describe("manager", () => {
    it("削除権限を持たない", () => {
      expect(hasPermission("manager", "properties:delete")).toBe(false);
      expect(hasPermission("manager", "tenants:delete")).toBe(false);
    });

    it("作成・編集権限を持つ", () => {
      expect(hasPermission("manager", "properties:create")).toBe(true);
      expect(hasPermission("manager", "contracts:edit")).toBe(true);
    });

    it("ユーザー管理権限を持たない", () => {
      expect(hasPermission("manager", "users:create")).toBe(false);
      expect(hasPermission("manager", "users:delete")).toBe(false);
    });

    it("閲覧は可能", () => {
      expect(hasPermission("manager", "users:read")).toBe(true);
    });
  });

  describe("staff", () => {
    it("物件の作成権限を持たない", () => {
      expect(hasPermission("staff", "properties:create")).toBe(false);
    });

    it("入居者の作成権限を持つ", () => {
      expect(hasPermission("staff", "tenants:create")).toBe(true);
    });

    it("修繕の作成・編集権限を持つ", () => {
      expect(hasPermission("staff", "maintenance:create")).toBe(true);
      expect(hasPermission("staff", "maintenance:edit")).toBe(true);
    });

    it("削除権限を持たない", () => {
      expect(hasPermission("staff", "maintenance:delete")).toBe(false);
    });
  });

  describe("viewer", () => {
    it("閲覧権限のみ持つ", () => {
      expect(hasPermission("viewer", "properties:read")).toBe(true);
      expect(hasPermission("viewer", "tenants:read")).toBe(true);
    });

    it("作成・編集・削除権限を持たない", () => {
      expect(hasPermission("viewer", "properties:create")).toBe(false);
      expect(hasPermission("viewer", "tenants:edit")).toBe(false);
      expect(hasPermission("viewer", "contracts:delete")).toBe(false);
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
      expect(roleLabels.manager).toBe("マネージャー");
      expect(roleLabels.staff).toBe("スタッフ");
      expect(roleLabels.viewer).toBe("閲覧者");
    });
  });
});
