"use client";

import { X } from "lucide-react";

export default function UserInviteModal({
  open,
  inviting,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  inviting: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">ユーザーを追加</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              氏名 <span className="text-danger">*</span>
            </label>
            <input name="name" className="input" placeholder="例: 田中太郎" required />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              メールアドレス <span className="text-danger">*</span>
            </label>
            <input
              name="email"
              type="email"
              className="input"
              placeholder="例: tanaka@example.com"
              required
            />
            <p className="text-[11px] text-ink-3 mt-1.5">
              入力したアドレスに招待メールが送信されます。受信者がリンクからパスワードを設定します。
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">権限</label>
            <select name="role" className="input" defaultValue="staff">
              <option value="admin">管理者 — 全ての操作</option>
              <option value="staff">スタッフ — 削除以外の作成・編集</option>
              <option value="viewer">閲覧者 — 閲覧のみ</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
            >
              キャンセル
            </button>
            <button type="submit" disabled={inviting} className="btn btn-primary disabled:opacity-50">
              {inviting ? "送信中..." : "招待メールを送信"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
