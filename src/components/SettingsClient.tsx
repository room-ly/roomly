"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Crown, ExternalLink, Trash2 } from "lucide-react";

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

interface PlanOption {
  priceId: string;
  maxUnits: number;
  price: number;
  label: string;
}

export default function SettingsClient({ company, users }: SettingsClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<{
    currentUnits: number;
    maxUnits: number;
    isSubscriptionActive: boolean;
    periodEnd: string | null;
    hasStripeCustomer: boolean;
  }>({ currentUnits: 0, maxUnits: 10, isSubscriptionActive: false, periodEnd: null, hasStripeCustomer: false });

  useEffect(() => {
    fetch("/api/plan-check")
      .then((res) => res.json())
      .then((data) => {
        setPlans(data.plans ?? []);
        setPlanInfo({
          currentUnits: data.currentUnits ?? 0,
          maxUnits: data.maxUnits ?? 10,
          isSubscriptionActive: data.isSubscriptionActive ?? false,
          periodEnd: data.periodEnd ?? null,
          hasStripeCustomer: data.hasStripeCustomer ?? false,
        });
      })
      .catch(() => {});
  }, []);

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
      contract_alert_days: fd.get("contract_alert_days"),
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteTarget.id }),
    });

    if (res.ok) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      const err = await res.json();
      setDeleteError(err.error || "削除に失敗しました");
    }
    setDeleting(false);
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

          {/* 現在のプラン状況 */}
          <div className="p-4 rounded-lg bg-bg-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {planInfo.isSubscriptionActive ? (
                  <div className="w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center">
                    <Crown size={15} className="text-accent-deep" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-bg-2 border border-line flex items-center justify-center">
                    <span className="text-[11px] text-ink-3 font-medium">Free</span>
                  </div>
                )}
                <div>
                  <p className="text-[13px] font-semibold">
                    {planInfo.isSubscriptionActive
                      ? `〜${planInfo.maxUnits.toLocaleString()}区画プラン`
                      : "フリープラン"}
                  </p>
                  <p className="text-[12px] text-ink-3 mt-0.5">
                    {planInfo.currentUnits}区画 / {planInfo.maxUnits.toLocaleString()}区画
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {planInfo.isSubscriptionActive && planInfo.periodEnd && (
                  <p className="text-[11px] text-ink-3">
                    次回更新 {new Date(planInfo.periodEnd).toLocaleDateString("ja-JP")}
                  </p>
                )}
                {planInfo.hasStripeCustomer && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch("/api/stripe/portal", { method: "POST" });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    }}
                    className="flex items-center gap-1 text-[12px] text-accent-deep hover:underline"
                  >
                    請求管理 <ExternalLink size={11} />
                  </button>
                )}
              </div>
            </div>
            {/* 使用量バー */}
            <div className="mt-3">
              <div className="w-full h-1.5 rounded-full bg-line overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.min((planInfo.currentUnits / planInfo.maxUnits) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 料金テーブル */}
          {plans.length > 0 && (() => {
            const isCurrent = (maxUnits: number) =>
              planInfo.isSubscriptionActive && planInfo.maxUnits === maxUnits;
            const isFreeCurrent = !planInfo.isSubscriptionActive;
            const upgradePlans = planInfo.isSubscriptionActive
              ? plans.filter((p) => p.maxUnits > planInfo.maxUnits)
              : plans;
            const hasUpgrade = upgradePlans.length > 0;

            return hasUpgrade ? (
              <div>
                <p className="text-[13px] text-ink-2 mb-3">
                  区画数に応じた月額料金です。全プランで全機能が使えます。
                </p>
                <div className="rounded-lg border border-line overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-bg-2 text-ink-3 text-[11px] uppercase tracking-wider">
                        <th className="px-4 py-2.5 text-left font-medium">区画数</th>
                        <th className="px-4 py-2.5 text-right font-medium">月額（税込）</th>
                        <th className="px-4 py-2.5 text-right font-medium">区画単価</th>
                        <th className="px-4 py-2.5 w-28"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 現在のプラン行 */}
                      {isFreeCurrent && (
                        <tr className="border-t border-line bg-accent-tint/30">
                          <td className="px-4 py-3 font-medium">〜10区画</td>
                          <td className="px-4 py-3 text-right font-semibold">¥0</td>
                          <td className="px-4 py-3 text-right text-ink-3">—</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[12px] text-accent-deep font-medium">利用中</span>
                          </td>
                        </tr>
                      )}
                      {planInfo.isSubscriptionActive && plans.filter((p) => p.maxUnits === planInfo.maxUnits).map((plan) => (
                        <tr key={plan.priceId} className="border-t border-line bg-accent-tint/30">
                          <td className="px-4 py-3 font-medium">〜{plan.maxUnits.toLocaleString()}区画</td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">¥{plan.price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-ink-3 tabular-nums">¥{Math.round(plan.price / plan.maxUnits).toLocaleString()}/区画</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[12px] text-accent-deep font-medium">利用中</span>
                          </td>
                        </tr>
                      ))}
                      {/* アップグレード候補 */}
                      {upgradePlans.map((plan) => {
                        const unitPrice = Math.round(plan.price / plan.maxUnits);
                        return (
                          <tr key={plan.priceId} className="border-t border-line transition-colors hover:bg-bg-2/50">
                            <td className="px-4 py-3 font-medium">
                              〜{plan.maxUnits.toLocaleString()}区画
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                              ¥{plan.price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-ink-3 tabular-nums">
                              ¥{unitPrice.toLocaleString()}/区画
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                disabled={checkingOut !== null}
                                onClick={async () => {
                                  setCheckingOut(plan.priceId);
                                  const res = await fetch("/api/stripe/checkout", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ priceId: plan.priceId }),
                                  });
                                  const data = await res.json();
                                  if (data.url) {
                                    window.location.href = data.url;
                                  } else {
                                    alert(data.detail || data.error || "エラーが発生しました");
                                    setCheckingOut(null);
                                  }
                                }}
                                className="text-[12px] font-medium text-white bg-accent hover:bg-accent-deep rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
                              >
                                {checkingOut === plan.priceId ? "処理中..." : "選択"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-ink-3 mt-2">
                  2,001区画以上は1,000区画ごとに+¥5,000（税込）/月。お問い合わせください。
                </p>
                {planInfo.hasStripeCustomer && (
                  <p className="text-[11px] text-ink-3 mt-1">
                    現在のプランの変更・解約は「請求管理」から行えます。
                  </p>
                )}
              </div>
            ) : planInfo.hasStripeCustomer ? (
              <p className="text-[12px] text-ink-3">
                最上位プランをご利用中です。プランの変更・解約は「請求管理」から行えます。
              </p>
            ) : null;
          })()}
        </div>

        {/* 通知設定 */}
        <div className="card p-5 mb-4">
          <h2 className="text-[14px] font-semibold mb-4">通知設定</h2>
          <div>
            <label className="block text-[13px] font-medium text-ink-2 mb-1">契約満了アラート</label>
            <p className="text-[12px] text-ink-3 mb-2">契約終了日までの残り日数がこの値以下になるとバッジを表示します</p>
            <select
              name="contract_alert_days"
              defaultValue={company?.contract_alert_days ?? 90}
              className="input"
              style={{ width: "12rem" }}
            >
              <option value="30">30日前</option>
              <option value="60">60日前</option>
              <option value="90">90日前（デフォルト）</option>
              <option value="120">120日前</option>
              <option value="180">180日前（半年前）</option>
            </select>
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
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                  u.role === "admin" ? "bg-accent-tint text-accent" :
                  u.role === "manager" ? "bg-accent-tint text-accent-deep" :
                  "bg-bg-2 text-ink-3 border border-line"
                }`}>
                  {roleLabels[u.role] || u.role}
                </span>
                <button
                  onClick={() => { setDeleteTarget(u); setDeleteError(""); }}
                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-danger transition-all p-1 rounded hover:bg-danger/10"
                  title="削除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ユーザー削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-[15px] font-semibold mb-3">ユーザーを削除</h2>
            <p className="text-[13px] text-ink-2 mb-1">
              <span className="font-medium">{deleteTarget.name}</span>（{deleteTarget.email}）を削除しますか？
            </p>
            <p className="text-[12px] text-ink-3 mb-4">
              削除されたユーザーはログインできなくなります。
            </p>

            {deleteError && (
              <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">{deleteError}</div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-danger text-white rounded-lg px-4 py-2 text-sm hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}

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
