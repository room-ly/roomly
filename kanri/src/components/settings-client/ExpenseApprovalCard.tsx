"use client";

import { roleLabels } from "./constants";

type Company = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type User = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function ExpenseApprovalCard({
  company,
  users,
}: {
  company: Company;
  users: User[];
}) {
  return (
    <div className="card p-5 mb-4">
      <h2 className="text-[14px] font-semibold mb-1">費用承認</h2>
      <p className="text-[12px] text-ink-3 mb-4">
        オーナー負担の費用がしきい値以上のとき、ここで指定したユーザーに承認権限が出ます。
      </p>
      <div className="space-y-3">
        <div>
          <label className="block text-[13px] font-medium text-ink-2 mb-1">デフォルト承認者</label>
          <p className="text-[12px] text-ink-3 mb-2">
            物件側で承認者が指定されていない場合に使われます。社長やオーナー対応の責任者を指定してください。
          </p>
          <select
            name="default_approver_user_id"
            defaultValue={company?.default_approver_user_id || ""}
            className="input"
            style={{ width: "20rem", maxWidth: "100%" }}
          >
            <option value="">未設定（承認者が必要な費用は提出できません）</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}（{roleLabels[u.role] || u.role}）
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-ink-2 mb-1">承認しきい値（税込）</label>
          <p className="text-[12px] text-ink-3 mb-2">
            オーナー負担額がこの金額以上の費用は、承認待ちとして上記の承認者の判断を仰ぎます。
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-ink-3">¥</span>
            <input
              name="expense_approval_threshold"
              type="number"
              min={0}
              step={1000}
              defaultValue={company?.expense_approval_threshold ?? 50000}
              className="input tabular-nums"
              style={{ width: "12rem" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
