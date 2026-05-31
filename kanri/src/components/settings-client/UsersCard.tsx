"use client";

import { Plus, Trash2, Pencil, Mail } from "lucide-react";
import { roleLabels } from "./constants";

type User = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function UsersCard({
  users,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,
  resendingId,
  resendMsg,
  onInvite,
  onEdit,
  onDelete,
  onResendInvite,
}: {
  users: User[];
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  resendingId: string | null;
  resendMsg: string;
  onInvite: () => void;
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
  onResendInvite: (id: string) => void;
}) {
  return (
    <div className="card p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[14px] font-semibold">ユーザー管理</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">{users.length}名のユーザー</p>
        </div>
        {canCreateUsers && (
          <button onClick={onInvite} className="btn btn-primary text-[13px]">
            <Plus size={14} />
            ユーザーを追加
          </button>
        )}
      </div>

      {resendMsg && (
        <div className="bg-accent-tint text-accent-deep text-[12px] rounded-lg px-3 py-2 mb-3">
          {resendMsg}
        </div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-3 rounded bg-bg-2 group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center text-accent text-[12px] font-semibold">
                {u.name?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-[13px] font-medium">{u.name}</p>
                <p className="text-[11px] text-ink-3">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                  u.role === "admin"
                    ? "bg-accent-tint text-accent"
                    : u.role === "staff"
                    ? "bg-accent-tint text-accent-deep"
                    : "bg-bg-2 text-ink-3 border border-line"
                }`}
              >
                {roleLabels[u.role] || u.role}
              </span>
              {canEditUsers && (
                <button
                  onClick={() => onResendInvite(u.id)}
                  disabled={resendingId === u.id}
                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-accent transition-all p-1 rounded hover:bg-accent/10 disabled:opacity-50"
                  title="招待メールを再送"
                >
                  <Mail size={14} />
                </button>
              )}
              {canEditUsers && (
                <button
                  onClick={() => onEdit(u)}
                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-accent transition-all p-1 rounded hover:bg-accent/10"
                  title="編集"
                >
                  <Pencil size={14} />
                </button>
              )}
              {canDeleteUsers && (
                <button
                  onClick={() => onDelete(u)}
                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-danger transition-all p-1 rounded hover:bg-danger/10"
                  title="削除"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
