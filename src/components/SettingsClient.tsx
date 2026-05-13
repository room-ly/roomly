"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

interface SettingsClientProps {
  company: Record<string, any>;
  users: Record<string, any>[];
}

const roleLabels: Record<string, string> = {
  admin: "管理者",
  manager: "マネージャー",
  staff: "スタッフ",
  viewer: "閲覧のみ",
};

export default function SettingsClient({ company, users }: SettingsClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  async function handleSaveCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      address: fd.get("address"),
    };

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSaveMsg("保存しました");
      router.refresh();
      setTimeout(() => setSaveMsg(""), 2000);
    } else {
      const err = await res.json();
      setSaveMsg(err.error || "保存に失敗しました");
    }
    setSaving(false);
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
      role: fd.get("role"),
    };

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setInviteOpen(false);
      router.refresh();
    } else {
      const err = await res.json();
      setInviteError(err.error || "作成に失敗しました");
    }
    setInviting(false);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <form onSubmit={handleSaveCompany}>
        {/* 会社・オーナー情報 */}
        <div className="card p-5 mb-4">
          <h2 className="text-[14px] font-semibold mb-4">基本情報</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1">会社名 / 氏名</label>
              <input name="name" type="text" defaultValue={company?.name || ""} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-ink-2 mb-1">電話番号</label>
                <input name="phone" type="text" defaultValue={company?.phone || ""} className="input" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink-2 mb-1">メール</label>
                <input name="email" type="email" defaultValue={company?.email || ""} className="input" />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1">住所</label>
              <input name="address" type="text" defaultValue={company?.address || ""} className="input" />
            </div>
          </div>
        </div>

        {/* プラン */}
        <div className="card p-5 mb-4">
          <h2 className="text-[14px] font-semibold mb-4">プラン</h2>
          <div className="flex items-center justify-between p-3.5 rounded bg-bg-2">
            <div>
              <p className="text-[13px] font-medium">{company?.plan === "pro" ? "プロプラン" : "フリープラン"}</p>
              <p className="text-[12px] text-ink-3 mt-0.5">管理区画数 {company?.max_units || 10}区画まで</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saveMsg && (
            <span className={`text-[13px] ${saveMsg === "保存しました" ? "text-accent-deep" : "text-danger"}`}>
              {saveMsg}
            </span>
          )}
          <button type="submit" disabled={saving} className="btn btn-primary px-8 disabled:opacity-50">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </form>

      {/* ユーザー管理 */}
      <div className="card p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-semibold">ユーザー管理</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">{users.length}名のユーザー</p>
          </div>
          <button onClick={() => setInviteOpen(true)} className="btn btn-primary text-[13px]">
            <Plus size={14} />
            ユーザーを追加
          </button>
        </div>

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded bg-bg-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center text-accent text-[12px] font-semibold">
                  {u.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-[13px] font-medium">{u.name}</p>
                  <p className="text-[11px] text-ink-3">{u.email}</p>
                </div>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                u.role === "admin" ? "bg-accent-tint text-accent" :
                u.role === "manager" ? "bg-accent-tint text-accent-deep" :
                "bg-bg-2 text-ink-3 border border-line"
              }`}>
                {roleLabels[u.role] || u.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ユーザー追加モーダル */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setInviteOpen(false)}>
          <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold">ユーザーを追加</h2>
              <button onClick={() => setInviteOpen(false)} className="text-ink-3 hover:text-ink transition-colors">
                <X size={18} />
              </button>
            </div>

            {inviteError && (
              <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">{inviteError}</div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">氏名 <span className="text-danger">*</span></label>
                <input name="name" className="input" placeholder="例: 田中太郎" required />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">メールアドレス <span className="text-danger">*</span></label>
                <input name="email" type="email" className="input" placeholder="例: tanaka@example.com" required />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">初期パスワード <span className="text-danger">*</span></label>
                <input name="password" type="password" className="input" placeholder="8文字以上" minLength={8} required />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">権限</label>
                <select name="role" className="input" defaultValue="staff">
                  <option value="admin">管理者 — 全機能</option>
                  <option value="manager">マネージャー — 物件・契約・家賃管理</option>
                  <option value="staff">スタッフ — 日常業務</option>
                  <option value="viewer">閲覧のみ</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setInviteOpen(false)} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors">
                  キャンセル
                </button>
                <button type="submit" disabled={inviting} className="btn btn-primary disabled:opacity-50">
                  {inviting ? "作成中..." : "追加する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
