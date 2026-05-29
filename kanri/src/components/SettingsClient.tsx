"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Crown, ExternalLink, Trash2, Pencil, ShieldCheck, ShieldOff, Building2, Star, Mail } from "lucide-react";
import BankSuggest from "./BankSuggest";
import PostalCodeInput from "./PostalCodeInput";

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
  const [editTarget, setEditTarget] = useState<Record<string, any> | null>(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState("");
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaSetup, setMfaSetup] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const [mfaMsg, setMfaMsg] = useState("");
  const [bankAccounts, setBankAccounts] = useState<Record<string, any>[]>([]);
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [bankEditTarget, setBankEditTarget] = useState<Record<string, any> | null>(null);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState("");
  const [bfBankName, setBfBankName] = useState("");
  const [bfBankCode, setBfBankCode] = useState("");
  const [bfBranchName, setBfBranchName] = useState("");
  const [bfBranchCode, setBfBranchCode] = useState("");
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [customUnits, setCustomUnits] = useState("");
  // 郵便番号補完で書き換わる会社住所
  const [companyAddress, setCompanyAddress] = useState(company?.address || "");
  const [planInfo, setPlanInfo] = useState<{
    currentUnits: number;
    maxUnits: number;
    isSubscriptionActive: boolean;
    periodEnd: string | null;
    hasStripeCustomer: boolean;
  }>({ currentUnits: 0, maxUnits: 10, isSubscriptionActive: false, periodEnd: null, hasStripeCustomer: false });

  useEffect(() => {
    fetch("/api/auth/mfa")
      .then((res) => res.json())
      .then((data) => {
        setMfaEnrolled(data.enrolled ?? false);
        if (data.factors?.length > 0) setMfaFactorId(data.factors[0].id);
      })
      .catch(() => {});
  }, []);

  function loadBankAccounts() {
    fetch("/api/bank-accounts")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setBankAccounts(data); })
      .catch(() => {});
  }

  useEffect(() => { loadBankAccounts(); }, []);

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
      postal_code: fd.get("postal_code"),
      address: fd.get("address"),
      contract_alert_days: fd.get("contract_alert_days"),
      estate_license: fd.get("estate_license"),
      estate_agent_name: fd.get("estate_agent_name"),
      estate_agent_license: fd.get("estate_agent_license"),
      default_approver_user_id: fd.get("default_approver_user_id"),
      expense_approval_threshold: fd.get("expense_approval_threshold"),
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

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true);
    setEditError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      userId: editTarget.id,
      name: fd.get("name"),
      email: fd.get("email"),
      role: fd.get("role"),
    };

    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setEditTarget(null);
      router.refresh();
    } else {
      const err = await res.json();
      setEditError(err.error || "更新に失敗しました");
    }
    setEditing(false);
  }

  async function handleBankSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBankSaving(true);
    setBankError("");

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      label: fd.get("label"),
      bank_name: fd.get("bank_name"),
      bank_code: fd.get("bank_code"),
      branch_name: fd.get("branch_name"),
      branch_code: fd.get("branch_code"),
      account_type: fd.get("account_type"),
      account_number: fd.get("account_number"),
      account_holder: fd.get("account_holder"),
      is_default: fd.get("is_default") === "on",
    };

    if (bankEditTarget) body.id = bankEditTarget.id;

    const res = await fetch("/api/bank-accounts", {
      method: bankEditTarget ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setBankFormOpen(false);
      setBankEditTarget(null);
      loadBankAccounts();
    } else {
      const err = await res.json();
      setBankError(err.error || "保存に失敗しました");
    }
    setBankSaving(false);
  }

  async function handleBankDelete(id: string) {
    const res = await fetch(`/api/bank-accounts?id=${id}`, { method: "DELETE" });
    if (res.ok) loadBankAccounts();
  }

  async function handleResendInvite(userId: string) {
    setResendingId(userId);
    setResendMsg("");
    const res = await fetch(`/api/users/${userId}/resend-invite`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setResendMsg(data.message || "招待を再送しました");
    } else {
      setResendMsg(data.error || "再送に失敗しました");
    }
    setResendingId(null);
    setTimeout(() => setResendMsg(""), 4000);
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      email: fd.get("email"),
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
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1">電話番号</label>
              <input name="phone" type="text" defaultValue={company?.phone || ""} className="input" />
            </div>
            <div className="flex gap-2">
              <div className="w-44">
                <label className="block text-[13px] font-medium text-ink-2 mb-1">郵便番号</label>
                <PostalCodeInput
                  defaultValue={company?.postal_code || ""}
                  placeholder="例: 150-0001"
                  onResolved={(r) => setCompanyAddress(r.address)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-medium text-ink-2 mb-1">住所</label>
                <input name="address" type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="input" />
              </div>
            </div>
          </div>
        </div>

        {/* 宅建業者情報 */}
        <div className="card p-5 mb-4">
          <h2 className="text-[14px] font-semibold mb-1">宅建業者情報</h2>
          <p className="text-[12px] text-ink-3 mb-4">契約書・重要事項説明書に印字されます</p>
          <div className="space-y-3">
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1">宅地建物取引業者免許番号</label>
              <input name="estate_license" type="text" defaultValue={company?.estate_license || ""} className="input" placeholder="例: 国土交通大臣（1）第000000号" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1">専任宅地建物取引士 氏名</label>
              <input name="estate_agent_name" type="text" defaultValue={company?.estate_agent_name || ""} className="input" placeholder="例: 山田 太郎" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1">取引士証 登録番号</label>
              <input name="estate_agent_license" type="text" defaultValue={company?.estate_agent_license || ""} className="input" placeholder="例: 東京都知事登録（1）第000000号" />
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
            const isFreeCurrent = !planInfo.isSubscriptionActive;
            const upgradePlans = planInfo.isSubscriptionActive
              ? plans.filter((p) => p.maxUnits > planInfo.maxUnits)
              : plans;
            return (
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
                        <th className="px-4 py-2.5 w-28"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 現在のプラン行 */}
                      {isFreeCurrent && (
                        <tr className="border-t border-line bg-accent-tint/30">
                          <td className="px-4 py-3 font-medium">〜10区画</td>
                          <td className="px-4 py-3 text-right font-semibold">¥0</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[12px] text-accent-deep font-medium">利用中</span>
                          </td>
                        </tr>
                      )}
                      {planInfo.isSubscriptionActive && plans.filter((p) => p.maxUnits === planInfo.maxUnits).map((plan) => (
                        <tr key={plan.priceId} className="border-t border-line bg-accent-tint/30">
                          <td className="px-4 py-3 font-medium">〜{plan.maxUnits.toLocaleString()}区画</td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">¥{plan.price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[12px] text-accent-deep font-medium">利用中</span>
                          </td>
                        </tr>
                      ))}
                      {/* アップグレード候補 */}
                      {upgradePlans.map((plan) => (
                          <tr key={plan.priceId} className="border-t border-line transition-colors hover:bg-bg-2/50">
                            <td className="px-4 py-3 font-medium">
                              〜{plan.maxUnits.toLocaleString()}区画
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                              ¥{plan.price.toLocaleString()}
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
                      ))}
                      {/* 2,001区画〜 */}
                      <tr className="border-t border-line transition-colors hover:bg-bg-2/50">
                        <td className="px-4 py-3">
                          <p className="font-medium">2,001区画〜</p>
                          <p className="text-[11px] text-ink-3 mt-0.5">1,000区画ごとに+¥5,000（税込）/月</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              min={3000}
                              step={1000}
                              placeholder="3000"
                              value={customUnits}
                              onChange={(e) => setCustomUnits(e.target.value)}
                              className="input w-24 text-right text-[13px] tabular-nums"
                            />
                            <span className="text-[12px] text-ink-3">区画</span>
                          </div>
                          {customUnits && Number(customUnits) > 2000 && (
                            <p className="text-[12px] font-semibold tabular-nums mt-1">
                              ¥{(30000 + Math.ceil((Number(customUnits) - 2000) / 1000) * 5000).toLocaleString()}/月
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={checkingOut !== null || !customUnits || Number(customUnits) <= 2000}
                            onClick={async () => {
                              const units = Number(customUnits);
                              if (units <= 2000) return;
                              setCheckingOut("custom");
                              const res = await fetch("/api/stripe/checkout", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ maxUnits: units }),
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
                            {checkingOut === "custom" ? "処理中..." : "選択"}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {planInfo.hasStripeCustomer && (
                  <p className="text-[11px] text-ink-3 mt-1">
                    現在のプランの変更・解約は「請求管理」から行えます。
                  </p>
                )}
              </div>
            );
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

        {/* 経費承認 */}
        <div className="card p-5 mb-4">
          <h2 className="text-[14px] font-semibold mb-1">経費承認</h2>
          <p className="text-[12px] text-ink-3 mb-4">オーナー負担の経費がしきい値以上のとき、ここで指定したユーザーに承認権限が出ます。</p>
          <div className="space-y-3">
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1">デフォルト承認者</label>
              <p className="text-[12px] text-ink-3 mb-2">物件側で承認者が指定されていない場合に使われます。社長やオーナー対応の責任者を指定してください。</p>
              <select
                name="default_approver_user_id"
                defaultValue={company?.default_approver_user_id || ""}
                className="input"
                style={{ width: "20rem", maxWidth: "100%" }}
              >
                <option value="">未設定（承認者が必要な経費は提出できません）</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}（{roleLabels[u.role] || u.role}）
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1">承認しきい値（税込）</label>
              <p className="text-[12px] text-ink-3 mb-2">オーナー負担額がこの金額以上の経費は、承認待ちとして上記の承認者の判断を仰ぎます。</p>
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

        {/* 振込元口座 */}
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold">振込元口座</h2>
              <p className="text-[12px] text-ink-3 mt-0.5">全銀フォーマットCSV出力時の依頼人情報</p>
            </div>
            <button
              type="button"
              onClick={() => { setBankEditTarget(null); setBankFormOpen(true); setBankError(""); setBfBankName(""); setBfBankCode(""); setBfBranchName(""); setBfBranchCode(""); }}
              className="btn btn-primary text-[13px]"
            >
              <Plus size={14} /> 口座を追加
            </button>
          </div>

          {bankAccounts.length === 0 ? (
            <p className="text-[13px] text-ink-3 bg-bg-2 rounded-lg px-4 py-3">
              口座が登録されていません。全銀CSV出力には口座の登録が必要です。
            </p>
          ) : (
            <div className="space-y-2">
              {bankAccounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-2 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center">
                      <Building2 size={14} className="text-accent-deep" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium">{a.label}</p>
                        {a.is_default && (
                          <span className="flex items-center gap-0.5 text-[10px] text-accent-deep bg-accent-tint px-1.5 py-0.5 rounded font-medium">
                            <Star size={9} /> デフォルト
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-3 mt-0.5">
                        {a.bank_name}（{a.bank_code}）{a.branch_name}（{a.branch_code}）{a.account_type === "2" ? "当座" : "普通"} {a.account_number} {a.account_holder}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setBankEditTarget(a); setBankFormOpen(true); setBankError(""); setBfBankName(a.bank_name); setBfBankCode(a.bank_code); setBfBranchName(a.branch_name); setBfBranchCode(a.branch_code); }}
                      className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-accent transition-all p-1 rounded hover:bg-accent/10"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBankDelete(a.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-danger transition-all p-1 rounded hover:bg-danger/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 二要素認証 */}
        <div className="card p-5 mb-4">
          <h2 className="text-[14px] font-semibold mb-4">二要素認証（MFA）</h2>

          {mfaEnrolled && !mfaSetup ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-accent-deep" />
                <span className="text-[13px] font-medium text-accent-deep">有効</span>
              </div>
              <p className="text-[12px] text-ink-3 mb-3">認証アプリによる二要素認証が設定されています。</p>
              {mfaMsg && <p className="text-[13px] text-accent-deep mb-3">{mfaMsg}</p>}
              {mfaError && <p className="text-[13px] text-danger mb-3">{mfaError}</p>}
              <button
                type="button"
                disabled={mfaLoading}
                onClick={async () => {
                  setMfaLoading(true);
                  setMfaError("");
                  const res = await fetch("/api/auth/mfa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "unenroll", factorId: mfaFactorId }),
                  });
                  if (res.ok) {
                    setMfaEnrolled(false);
                    setMfaFactorId(null);
                    setMfaMsg("二要素認証を無効にしました");
                    setTimeout(() => setMfaMsg(""), 3000);
                  } else {
                    const err = await res.json();
                    setMfaError(err.error || "無効化に失敗しました");
                  }
                  setMfaLoading(false);
                }}
                className="flex items-center gap-1.5 text-[13px] text-danger hover:text-danger/80 transition-colors"
              >
                <ShieldOff size={14} />
                {mfaLoading ? "処理中..." : "二要素認証を無効にする"}
              </button>
            </div>
          ) : mfaSetup ? (
            <div>
              <p className="text-[13px] text-ink-2 mb-3">
                認証アプリ（Google Authenticator等）で以下のQRコードを読み取り、表示された6桁のコードを入力してください。
              </p>
              <div className="flex justify-center mb-4">
                <img src={mfaSetup.qrCode} alt="MFA QRコード" className="w-48 h-48" />
              </div>
              <div className="mb-4">
                <p className="text-[11px] text-ink-3 mb-1">QRコードを読み取れない場合、このキーを手動入力してください:</p>
                <code className="block text-[12px] bg-bg-2 rounded px-3 py-2 font-mono break-all select-all">
                  {mfaSetup.secret}
                </code>
              </div>
              <div className="mb-3">
                <label className="block text-[13px] font-medium text-ink-2 mb-1">認証コード</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="input w-40 text-center text-lg tracking-[0.3em]"
                />
              </div>
              {mfaError && <p className="text-[13px] text-danger mb-3">{mfaError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={mfaLoading || mfaCode.length !== 6}
                  onClick={async () => {
                    setMfaLoading(true);
                    setMfaError("");
                    const res = await fetch("/api/auth/mfa", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "verify", factorId: mfaSetup.factorId, code: mfaCode }),
                    });
                    if (res.ok) {
                      setMfaEnrolled(true);
                      setMfaFactorId(mfaSetup.factorId);
                      setMfaSetup(null);
                      setMfaCode("");
                      setMfaMsg("二要素認証を有効にしました");
                      setTimeout(() => setMfaMsg(""), 3000);
                    } else {
                      const err = await res.json();
                      setMfaError(err.error || "認証に失敗しました");
                    }
                    setMfaLoading(false);
                  }}
                  className="btn btn-primary text-[13px] disabled:opacity-50"
                >
                  {mfaLoading ? "確認中..." : "有効にする"}
                </button>
                <button
                  type="button"
                  onClick={() => { setMfaSetup(null); setMfaCode(""); setMfaError(""); }}
                  className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-[13px] hover:bg-bg-2/80 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[12px] text-ink-3 mb-3">
                二要素認証を有効にすると、ログイン時にパスワードに加えて認証アプリのコードが必要になります。
              </p>
              {mfaMsg && <p className="text-[13px] text-accent-deep mb-3">{mfaMsg}</p>}
              {mfaError && <p className="text-[13px] text-danger mb-3">{mfaError}</p>}
              <button
                type="button"
                disabled={mfaLoading}
                onClick={async () => {
                  setMfaLoading(true);
                  setMfaError("");
                  const res = await fetch("/api/auth/mfa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "enroll" }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setMfaSetup({ factorId: data.factorId, qrCode: data.qrCode, secret: data.secret });
                  } else {
                    setMfaError(data.error || "設定の開始に失敗しました");
                  }
                  setMfaLoading(false);
                }}
                className="flex items-center gap-1.5 btn btn-primary text-[13px]"
              >
                <ShieldCheck size={14} />
                {mfaLoading ? "準備中..." : "二要素認証を設定する"}
              </button>
            </div>
          )}
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

        {resendMsg && (
          <div className="bg-accent-tint text-accent-deep text-[12px] rounded-lg px-3 py-2 mb-3">{resendMsg}</div>
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
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                  u.role === "admin" ? "bg-accent-tint text-accent" :
                  u.role === "manager" ? "bg-accent-tint text-accent-deep" :
                  "bg-bg-2 text-ink-3 border border-line"
                }`}>
                  {roleLabels[u.role] || u.role}
                </span>
                <button
                  onClick={() => handleResendInvite(u.id)}
                  disabled={resendingId === u.id}
                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-accent transition-all p-1 rounded hover:bg-accent/10 disabled:opacity-50"
                  title="招待メールを再送"
                >
                  <Mail size={14} />
                </button>
                <button
                  onClick={() => { setEditTarget(u); setEditError(""); }}
                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-accent transition-all p-1 rounded hover:bg-accent/10"
                  title="編集"
                >
                  <Pencil size={14} />
                </button>
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

      {/* ユーザー編集モーダル */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setEditTarget(null)}>
          <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold">ユーザーを編集</h2>
              <button onClick={() => setEditTarget(null)} className="text-ink-3 hover:text-ink transition-colors">
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">{editError}</div>
            )}

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">氏名 <span className="text-danger">*</span></label>
                <input name="name" className="input" defaultValue={editTarget.name || ""} required />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">メールアドレス <span className="text-danger">*</span></label>
                <input name="email" type="email" className="input" defaultValue={editTarget.email || ""} required />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">権限</label>
                <select name="role" className="input" defaultValue={editTarget.role || "staff"}>
                  <option value="admin">管理者 — 全機能</option>
                  <option value="manager">マネージャー — 物件・契約・家賃管理</option>
                  <option value="staff">スタッフ — 日常業務</option>
                  <option value="viewer">閲覧のみ</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setEditTarget(null)} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors">
                  キャンセル
                </button>
                <button type="submit" disabled={editing} className="btn btn-primary disabled:opacity-50">
                  {editing ? "保存中..." : "保存する"}
                </button>
              </div>
            </form>
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
                <p className="text-[11px] text-ink-3 mt-1.5">入力したアドレスに招待メールが送信されます。受信者がリンクからパスワードを設定します。</p>
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
                  {inviting ? "送信中..." : "招待メールを送信"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 口座追加・編集モーダル */}
      {bankFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setBankFormOpen(false)}>
          <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold">{bankEditTarget ? "口座を編集" : "口座を追加"}</h2>
              <button onClick={() => setBankFormOpen(false)} className="text-ink-3 hover:text-ink transition-colors">
                <X size={18} />
              </button>
            </div>

            {bankError && (
              <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">{bankError}</div>
            )}

            <form onSubmit={handleBankSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">表示名 <span className="text-danger">*</span></label>
                <input name="label" className="input" defaultValue={bankEditTarget?.label || ""} placeholder="例: メインバンク" required />
              </div>
              <BankSuggest
                nameValue={bfBankName}
                codeValue={bfBankCode}
                onNameChange={setBfBankName}
                onCodeChange={setBfBankCode}
                branchNameValue={bfBranchName}
                branchCodeValue={bfBranchCode}
                onBranchNameChange={setBfBranchName}
                onBranchCodeChange={setBfBranchCode}
                branchNameName="branch_name"
                branchCodeName="branch_code"
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">種別</label>
                  <select name="account_type" className="input" defaultValue={bankEditTarget?.account_type || "1"}>
                    <option value="1">普通</option>
                    <option value="2">当座</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">口座番号 <span className="text-danger">*</span></label>
                  <input name="account_number" className="input tabular-nums" defaultValue={bankEditTarget?.account_number || ""} placeholder="1234567" maxLength={7} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">名義（カナ） <span className="text-danger">*</span></label>
                  <input name="account_holder" className="input" defaultValue={bankEditTarget?.account_holder || ""} placeholder="カ）ルームリー" required />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_default" defaultChecked={bankEditTarget?.is_default ?? false} className="rounded border-line" />
                  <span className="text-sm text-ink-2">デフォルトの口座にする</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setBankFormOpen(false)} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2/80 transition-colors">
                  キャンセル
                </button>
                <button type="submit" disabled={bankSaving} className="btn btn-primary disabled:opacity-50">
                  {bankSaving ? "保存中..." : bankEditTarget ? "更新する" : "追加する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
