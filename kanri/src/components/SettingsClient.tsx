"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/lib/use-permission";
import type { PlanInfo, PlanOption } from "./settings-client/constants";
import CompanyBasicCard from "./settings-client/CompanyBasicCard";
import CompanyLogoCard from "./settings-client/CompanyLogoCard";
import EstateLicenseCard from "./settings-client/EstateLicenseCard";
import PlanCard from "./settings-client/PlanCard";
import NotificationCard from "./settings-client/NotificationCard";
import ExpenseApprovalCard from "./settings-client/ExpenseApprovalCard";
import BankAccountsCard from "./settings-client/BankAccountsCard";
import BankAccountModal from "./settings-client/BankAccountModal";
import MfaCard from "./settings-client/MfaCard";
import UsersCard from "./settings-client/UsersCard";
import UserInviteModal from "./settings-client/UserInviteModal";
import UserEditModal from "./settings-client/UserEditModal";
import UserDeleteModal from "./settings-client/UserDeleteModal";

interface SettingsClientProps {
  company: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  users: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function SettingsClient({ company, users }: SettingsClientProps) {
  const router = useRouter();
  const canEditSettings = usePermission("settings:edit");
  const canCreateUsers = usePermission("users:create");
  const canEditUsers = usePermission("users:edit");
  const canDeleteUsers = usePermission("users:delete");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // ユーザー招待・編集・削除
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [editTarget, setEditTarget] = useState<Record<string, any> | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState("");

  // MFA
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaSetup, setMfaSetup] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const [mfaMsg, setMfaMsg] = useState("");

  // 銀行口座
  const [bankAccounts, setBankAccounts] = useState<Record<string, any>[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [bankEditTarget, setBankEditTarget] = useState<Record<string, any> | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState("");
  const [bfBankName, setBfBankName] = useState("");
  const [bfBankCode, setBfBankCode] = useState("");
  const [bfBranchName, setBfBranchName] = useState("");
  const [bfBranchCode, setBfBranchCode] = useState("");

  // プラン
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [customUnits, setCustomUnits] = useState("");
  const [planInfo, setPlanInfo] = useState<PlanInfo>({
    currentUnits: 0,
    maxUnits: 10,
    isSubscriptionActive: false,
    periodEnd: null,
    hasStripeCustomer: false,
  });

  // 郵便番号補完で書き換わる会社住所
  const [companyAddress, setCompanyAddress] = useState(company?.address || "");

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
      .then((data) => {
        if (Array.isArray(data)) setBankAccounts(data);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadBankAccounts();
  }, []);

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
      seal_column_enabled: fd.get("seal_column_enabled") === "on",
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

  // MFA ハンドラ
  async function handleMfaEnroll() {
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
  }

  async function handleMfaVerify() {
    if (!mfaSetup) return;
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
  }

  async function handleMfaUnenroll() {
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
  }

  function openBankAdd() {
    setBankEditTarget(null);
    setBankFormOpen(true);
    setBankError("");
    setBfBankName("");
    setBfBankCode("");
    setBfBranchName("");
    setBfBranchCode("");
  }

  function openBankEdit(a: Record<string, any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
    setBankEditTarget(a);
    setBankFormOpen(true);
    setBankError("");
    setBfBankName(a.bank_name);
    setBfBankCode(a.bank_code);
    setBfBranchName(a.branch_name);
    setBfBranchCode(a.branch_code);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <form onSubmit={handleSaveCompany}>
        <CompanyBasicCard
          company={company}
          address={companyAddress}
          setAddress={setCompanyAddress}
        />
        <CompanyLogoCard company={company} canEditSettings={canEditSettings} />
        <EstateLicenseCard company={company} />
        <PlanCard
          plans={plans}
          planInfo={planInfo}
          checkingOut={checkingOut}
          setCheckingOut={setCheckingOut}
          customUnits={customUnits}
          setCustomUnits={setCustomUnits}
        />
        <NotificationCard company={company} />
        <ExpenseApprovalCard company={company} users={users} />
        <BankAccountsCard
          accounts={bankAccounts}
          canEditSettings={canEditSettings}
          onAdd={openBankAdd}
          onEdit={openBankEdit}
          onDelete={handleBankDelete}
        />
        <MfaCard
          enrolled={mfaEnrolled}
          factorId={mfaFactorId}
          setup={mfaSetup}
          code={mfaCode}
          setCode={setMfaCode}
          loading={mfaLoading}
          error={mfaError}
          msg={mfaMsg}
          onStartEnroll={handleMfaEnroll}
          onVerify={handleMfaVerify}
          onUnenroll={handleMfaUnenroll}
          onCancelSetup={() => {
            setMfaSetup(null);
            setMfaCode("");
            setMfaError("");
          }}
        />

        <div className="flex items-center justify-end gap-3">
          {saveMsg && (
            <span
              className={`text-[13px] ${
                saveMsg === "保存しました" ? "text-accent-deep" : "text-danger"
              }`}
            >
              {saveMsg}
            </span>
          )}
          {canEditSettings && (
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-8 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          )}
        </div>
      </form>

      <UsersCard
        users={users}
        canCreateUsers={canCreateUsers}
        canEditUsers={canEditUsers}
        canDeleteUsers={canDeleteUsers}
        resendingId={resendingId}
        resendMsg={resendMsg}
        onInvite={() => setInviteOpen(true)}
        onEdit={(u) => {
          setEditTarget(u);
          setEditError("");
        }}
        onDelete={(u) => {
          setDeleteTarget(u);
          setDeleteError("");
        }}
        onResendInvite={handleResendInvite}
      />

      <UserDeleteModal
        target={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <UserEditModal
        target={editTarget}
        editing={editing}
        error={editError}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />
      <UserInviteModal
        open={inviteOpen}
        inviting={inviting}
        error={inviteError}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
      />
      <BankAccountModal
        open={bankFormOpen}
        editTarget={bankEditTarget}
        saving={bankSaving}
        error={bankError}
        bankName={bfBankName}
        bankCode={bfBankCode}
        branchName={bfBranchName}
        branchCode={bfBranchCode}
        setBankName={setBfBankName}
        setBankCode={setBfBankCode}
        setBranchName={setBfBranchName}
        setBranchCode={setBfBranchCode}
        onClose={() => setBankFormOpen(false)}
        onSubmit={handleBankSubmit}
      />
    </div>
  );
}
