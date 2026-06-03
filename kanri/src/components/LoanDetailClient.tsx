"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wand2, Upload, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { usePermission } from "@/lib/use-permission";
import { useConfirm, useNotify, usePrompt } from "@/lib/confirm-context";
import LoanRepaymentCsvModal from "./LoanRepaymentCsvModal";

interface Props {
  loan: Record<string, any>;
  repayments: Record<string, any>[];
}

const yen = (v: number | null | undefined) =>
  v == null ? "—" : `¥${Math.round(Number(v)).toLocaleString()}`;

const METHOD_LABEL: Record<string, string> = {
  equal_principal_and_interest: "元利均等",
  equal_principal: "元金均等",
};
const ENTRY_LABEL: Record<string, string> = {
  scheduled: "予定",
  prepayment: "繰上返済",
  adjustment: "調整",
};

export default function LoanDetailClient({ loan, repayments }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const notify = useNotify();
  const prompt = usePrompt();
  const canEdit = usePermission("loans:edit");
  const [busy, setBusy] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Record<string, any>>({});

  const links = (loan.loan_properties ?? []) as Record<string, any>[];

  async function generate() {
    if (!(await confirm({ title: "返済予定表を生成しますか？", message: "借入条件から返済予定表を生成します。既存の自動生成行は置き換えられます（手動追加行・繰上返済は残ります）。", confirmLabel: "生成する", variant: "neutral" }))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}/schedule`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) notify({ title: data.error || "生成に失敗しました" });
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addManualRow() {
    const payment_date = await prompt({
      title: "繰上返済を追加",
      message: "返済日を選択してください",
      inputType: "date",
      confirmLabel: "追加する",
    });
    if (!payment_date) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}/repayments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_date, entry_type: "prepayment", principal_amount: 0, interest_amount: 0 }),
      });
      if (!res.ok) notify({ title: "追加に失敗しました" });
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}/repayments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repayment_id: id, ...editRow }),
      });
      if (!res.ok) notify({ title: "更新に失敗しました" });
      else {
        setEditingId(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function togglePaid(row: Record<string, any>) {
    setBusy(true);
    try {
      await fetch(`/api/loans/${loan.id}/repayments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repayment_id: row.id,
          is_paid: !row.is_paid,
          paid_at: !row.is_paid ? row.payment_date : null,
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteRow(id: string) {
    if (!(await confirm({ title: "この返済行を削除しますか？", confirmLabel: "削除する", variant: "danger" }))) return;
    setBusy(true);
    try {
      await fetch(`/api/loans/${loan.id}/repayments?repayment_id=${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(row: Record<string, any>) {
    setEditingId(row.id);
    setEditRow({
      payment_date: row.payment_date,
      principal_amount: row.principal_amount,
      interest_amount: row.interest_amount,
      balance_after: row.balance_after ?? "",
      entry_type: row.entry_type,
    });
  }

  return (
    <>
      <Link href="/loans" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink mb-4 transition-colors">
        <ArrowLeft size={14} /> ローン一覧へ
      </Link>

      {/* 借入条件 */}
      <div className="card p-5 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Field label="借入元本" value={yen(loan.principal_amount)} />
          <Field label="金利" value={loan.interest_rate != null ? `${loan.interest_rate}%（${loan.interest_type === "variable" ? "変動" : "固定"}）` : "—"} />
          <Field label="返済方式" value={METHOD_LABEL[loan.repayment_method] ?? "—"} />
          <Field label="返済期間" value={loan.term_months ? `${loan.term_months}ヶ月` : "—"} />
          <Field label="実行日" value={loan.disbursement_date || "—"} />
          <Field label="初回返済日" value={loan.first_payment_date || "—"} />
          <Field label="返済日" value={loan.payment_day ? `毎月${loan.payment_day}日` : "—"} />
          <Field label="引落口座" value={loan.bank_account_label || "—"} />
          <Field
            label="対象物件"
            value={links.length === 0 ? "—" : links.map((l) => l.property?.name).filter(Boolean).join("、")}
          />
        </div>
        {loan.notes && <p className="text-sm text-ink-2 mt-3 pt-3 border-t border-border whitespace-pre-wrap">{loan.notes}</p>}
      </div>

      {/* 操作 */}
      {canEdit && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button className="btn btn-secondary btn-sm" onClick={generate} disabled={busy}>
            <Wand2 size={14} /> 借入条件から予定表を生成
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setCsvOpen(true)} disabled={busy}>
            <Upload size={14} /> 償還予定表CSVを取込
          </button>
          <button className="btn btn-ghost btn-sm" onClick={addManualRow} disabled={busy}>
            <Plus size={14} /> 行を手動追加
          </button>
        </div>
      )}

      {/* 返済予定表 */}
      {repayments.length === 0 ? (
        <div className="card p-10 text-center text-ink-3">
          返済予定表がありません。<br />
          借入条件を入力して「予定表を生成」するか、銀行発行の償還予定表CSVを取り込んでください。
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left px-3 py-2.5 font-medium text-ink-2">回</th>
                <th className="text-left px-3 py-2.5 font-medium text-ink-2">返済日</th>
                <th className="text-right px-3 py-2.5 font-medium text-ink-2">元金</th>
                <th className="text-right px-3 py-2.5 font-medium text-ink-2">利息</th>
                <th className="text-right px-3 py-2.5 font-medium text-ink-2">返済額</th>
                <th className="text-right px-3 py-2.5 font-medium text-ink-2">残高</th>
                <th className="text-left px-3 py-2.5 font-medium text-ink-2">区分</th>
                <th className="text-center px-3 py-2.5 font-medium text-ink-2">入金</th>
                {canEdit && <th className="px-3 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {repayments.map((r) => {
                const isEditing = editingId === r.id;
                if (isEditing) {
                  return (
                    <tr key={r.id} className="bg-accent-tint/30">
                      <td className="px-3 py-2 text-ink-3">{r.installment_no ?? "—"}</td>
                      <td className="px-3 py-2">
                        <input type="date" className="input py-1 text-xs" value={editRow.payment_date || ""}
                          onChange={(e) => setEditRow((s) => ({ ...s, payment_date: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" className="input py-1 text-xs text-right w-28" value={editRow.principal_amount ?? ""}
                          onChange={(e) => setEditRow((s) => ({ ...s, principal_amount: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" className="input py-1 text-xs text-right w-28" value={editRow.interest_amount ?? ""}
                          onChange={(e) => setEditRow((s) => ({ ...s, interest_amount: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2 text-right text-ink-3 tabular-nums">
                        {yen(Number(editRow.principal_amount || 0) + Number(editRow.interest_amount || 0))}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" className="input py-1 text-xs text-right w-28" value={editRow.balance_after ?? ""}
                          onChange={(e) => setEditRow((s) => ({ ...s, balance_after: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <select className="input py-1 text-xs" value={editRow.entry_type || "scheduled"}
                          onChange={(e) => setEditRow((s) => ({ ...s, entry_type: e.target.value }))}>
                          <option value="scheduled">予定</option>
                          <option value="prepayment">繰上返済</option>
                          <option value="adjustment">調整</option>
                        </select>
                      </td>
                      <td />
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 justify-end">
                          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => saveEdit(r.id)}>保存</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>取消</button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={r.id} className={`hover:bg-surface-2 transition-colors ${r.is_paid ? "opacity-70" : ""}`}>
                    <td className="px-3 py-2 text-ink-3">{r.installment_no ?? "—"}</td>
                    <td className="px-3 py-2">{r.payment_date}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{yen(r.principal_amount)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-2">{yen(r.interest_amount)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{yen(r.total_amount)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-2">{yen(r.balance_after)}</td>
                    <td className="px-3 py-2 text-ink-2">
                      {ENTRY_LABEL[r.entry_type] ?? r.entry_type}
                      {r.source === "manual" && <span className="text-ink-4 text-xs ml-1">(手動)</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => canEdit && togglePaid(r)}
                        disabled={!canEdit || busy}
                        className={`inline-flex items-center justify-center w-5 h-5 rounded border transition-colors ${
                          r.is_paid ? "bg-success text-white border-success" : "border-line text-transparent hover:border-success"
                        }`}
                        title={r.is_paid ? "入金済み" : "未入金"}
                      >
                        <Check size={12} />
                      </button>
                    </td>
                    {canEdit && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => startEdit(r)} className="text-xs text-ink-3 hover:text-accent transition-colors">編集</button>
                          <button onClick={() => deleteRow(r.id)} className="text-ink-3 hover:text-danger transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {busy && (
        <div className="fixed bottom-4 right-4 bg-surface border border-line rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 text-sm z-50">
          <Loader2 size={14} className="animate-spin" /> 処理中…
        </div>
      )}

      <LoanRepaymentCsvModal
        isOpen={csvOpen}
        onClose={() => setCsvOpen(false)}
        loanId={loan.id}
      />
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-ink-3 text-xs mb-0.5">{label}</div>
      <div className="text-ink font-medium break-words">{value}</div>
    </div>
  );
}
