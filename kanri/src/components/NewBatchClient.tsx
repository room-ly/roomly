"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import SelectBox from "./SelectBox";
import { detectBlockers, hasBlockingIssue, isAllDone } from "@/lib/batch-blockers";
import type {
  BatchCandidateRemittance,
  BatchCandidateExpense,
  UnconfirmedOwnerCandidate,
  MonthSettlementSummary,
} from "@/lib/payment-batch-service";

const CATEGORY_LABEL: Record<string, string> = {
  repair: "修繕費", cleaning: "清掃費", insurance: "保険料",
  tax: "税金", utility: "光熱費", other: "その他",
};

interface PayeeOption {
  id: string;
  name: string;
  bank_code: string | null;
  branch_code: string | null;
  account_number: string | null;
  account_holder_kana: string | null;
}

interface Props {
  remittances: BatchCandidateRemittance[];
  expenses: BatchCandidateExpense[];
  unconfirmedOwners: UnconfirmedOwnerCandidate[];
  summary: MonthSettlementSummary;
  month: string; // YYYY-MM（対象月）
  banks: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  payees: PayeeOption[];
}

export default function NewBatchClient({ remittances, expenses, unconfirmedOwners, summary, month, banks, payees }: Props) {
  const router = useRouter();
  const [batchDate, setBatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [senderId, setSenderId] = useState(banks.find((b) => b.is_default)?.id ?? banks[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [selRem, setSelRem] = useState<Set<string>>(new Set());
  const [selExp, setSelExp] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null); // 支払先設定中の費用ID
  const [selOwner, setSelOwner] = useState<Set<string>>(new Set()); // 未確定オーナーの選択

  const payeeHasBank = (p: PayeeOption | undefined) =>
    !!(p && p.bank_code && p.branch_code && p.account_number && p.account_holder_kana);

  // 対象月を切り替える（候補をサーバーから取り直す）
  function changeMonth(nextMonth: string) {
    router.push(`/payments?month=${nextMonth}`);
  }

  // 行内で費用に支払先を設定する。設定後はサーバーから候補を取り直す（has_bank等を再評価）。
  async function assignPayee(expenseId: string, payeeId: string) {
    if (!payeeId) return;
    setAssigningId(expenseId);
    setError("");
    try {
      const res = await fetch(`/api/expenses/${expenseId}/payee`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payee_id: payeeId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "支払先の設定に失敗しました");
        return;
      }
      router.refresh();
    } catch {
      setError("支払先の設定に失敗しました");
    } finally {
      setAssigningId(null);
    }
  }

  // 選択中の行は背景・左罫で明示する（チェックの有無だけでは判別しづらいため）
  const rowClass = (selected: boolean, enabled: boolean) => {
    // 選択不可の行はカーソルも変えて「押しても反応しない」ことを伝える
    if (!enabled) return "cursor-not-allowed bg-surface-2/60 text-ink-3";
    const base = "cursor-pointer transition-colors";
    return selected
      ? `${base} bg-accent-tint shadow-[inset_3px_0_0_var(--accent)]`
      : `${base} hover:bg-surface-2`;
  };

  // オーナー行の全選択／全解除（口座情報が揃っている行のみ対象）
  const ownerSelectableCount =
    remittances.filter((r) => r.has_bank).length + unconfirmedOwners.filter((o) => o.has_bank).length;
  const ownerRowsTotal = remittances.length + unconfirmedOwners.length;
  const ownersWithoutBank = [
    ...remittances.filter((r) => !r.has_bank).map((r) => r.owner_name),
    ...unconfirmedOwners.filter((o) => !o.has_bank).map((o) => o.owner_name),
  ];
  const ownerAllSelected =
    ownerSelectableCount > 0 && selRem.size + selOwner.size === ownerSelectableCount;
  function toggleAllOwners() {
    if (ownerAllSelected) {
      setSelRem(new Set());
      setSelOwner(new Set());
    } else {
      setSelRem(new Set(remittances.filter((r) => r.has_bank).map((r) => r.id)));
      setSelOwner(new Set(unconfirmedOwners.filter((o) => o.has_bank).map((o) => o.owner_id)));
    }
  }

  const expenseSelectableCount = expenses.filter((e) => e.has_bank).length;
  const expenseAllSelected = expenseSelectableCount > 0 && selExp.size === expenseSelectableCount;
  function toggleAllExpenses() {
    setSelExp(expenseAllSelected ? new Set() : new Set(expenses.filter((e) => e.has_bank).map((e) => e.id)));
  }

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const total =
    remittances.filter((r) => selRem.has(r.id)).reduce((s, r) => s + r.amount, 0) +
    unconfirmedOwners.filter((o) => selOwner.has(o.owner_id)).reduce((s, o) => s + o.preview_net_amount, 0) +
    expenses.filter((e) => selExp.has(e.id)).reduce((s, e) => s + e.amount, 0);
  const count = selRem.size + selOwner.size + selExp.size;

  // 作成できない原因をまとめて算出し、ボタン付近に提示する
  const blockers = detectBlockers(
    {
      owner_rows: remittances.length + unconfirmedOwners.length,
      owners_without_bank: [
        ...remittances.filter((r) => !r.has_bank).map((r) => r.owner_name),
        ...unconfirmedOwners.filter((o) => !o.has_bank).map((o) => o.owner_name),
      ],
      expense_rows: expenses.length,
      expenses_without_payee: expenses.filter((e) => !e.has_payee).length,
      expenses_payee_no_bank: expenses.filter((e) => e.has_payee && !e.has_bank).length,
      month_paid_total: summary.month_paid_total,
      registered_owners: summary.registered_owners,
      confirmed_owners: summary.confirmed_owners,
      has_sender_account: banks.length > 0,
      selected_count: count,
      selectable_count: ownerSelectableCount + expenseSelectableCount,
    },
    month
  );
  const hasMissing = hasBlockingIssue(blockers);
  const allDone = isAllDone(blockers);

  async function handleCreate() {
    if (count === 0) { setError("振込対象を1件以上選択してください"); return; }
    setError("");
    setLoading(true);
    try {
      // 未確定オーナーの確定は prepare 側で自動的に行われる（利用者は意識しない）
      const res = await fetch("/api/payment-batches/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remittance_month: `${month}-01`,
          batch_date: batchDate,
          sender_account_id: senderId || null,
          notes: notes || null,
          owner_ids: Array.from(selOwner),
          remittance_ids: Array.from(selRem),
          expense_ids: Array.from(selExp),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "振込データの作成に失敗しました");
        return;
      }
      if (json.failed?.length > 0) {
        const names = json.failed.map((f: { owner_name: string }) => f.owner_name).join("、");
        setError(`一部のオーナーを処理できませんでした（${names}）`);
        return;
      }
      router.push(`/payments/${json.batch.id}`);
    } catch {
      setError("振込データの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-ink-3 block mb-1">振込日</label>
            <input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="text-xs text-ink-3 block mb-1">振込元口座</label>
            <select value={senderId} onChange={(e) => setSenderId(e.target.value)} className="input">
              {banks.length === 0 && <option value="">（口座未登録）</option>}
              {banks.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-3 block mb-1">備考</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="例: 6/11 第1回" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <label className="text-xs text-ink-3">精算対象月</label>
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && changeMonth(e.target.value)}
            className="input py-1 text-[13px] max-w-[160px]"
          />
          <span className="text-xs text-ink-4">この月のオーナー精算を計算・確定して振込対象にします</span>
        </div>

        {/* 対象月の精算進捗（締めの俯瞰） */}
        {summary.total_owners > 0 && (
          <div className="rounded-lg border border-border bg-surface-2 px-4 py-3">
            <div className="flex items-center justify-between mb-2 text-[13px]">
              <span className="font-medium">
                {month} の精算進捗
                <span className="text-ink-3 font-normal ml-2">
                  {summary.confirmed_owners}/{summary.total_owners}名 確定
                </span>
              </span>
              {summary.unconfirmed_owners > 0 ? (
                <span className="text-warning">未確定 {summary.unconfirmed_owners}名</span>
              ) : (
                <span className="text-success">全オーナー確定済み</span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.round((summary.confirmed_owners / summary.total_owners) * 100)}%` }}
              />
            </div>
            <div className="flex gap-5 mt-2 text-xs text-ink-3">
              <span>確定済み送金額 <span className="font-medium text-ink-2">¥{summary.confirmed_amount.toLocaleString()}</span></span>
              {summary.unconfirmed_amount > 0 && (
                <span>未確定の精算予定 <span className="font-medium text-ink-2">¥{summary.unconfirmed_amount.toLocaleString()}</span></span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* オーナーへの送金 — 確定済み・未確定を1つの表にまとめる。
          「確定」はCSVを出すための内部処理なので、利用者には見せない。 */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-2 text-sm font-semibold flex items-center gap-2">
          オーナーへの送金
          <span className="text-xs text-ink-3 font-normal ml-2">
            {month}・{selRem.size + selOwner.size}/{remittances.length + unconfirmedOwners.length}件選択
          </span>
          {ownerSelectableCount > 0 && (
            <button onClick={toggleAllOwners}
              className="ml-auto text-xs rlink font-normal">
              {ownerAllSelected ? "すべて解除" : "すべて選択"}
            </button>
          )}
        </div>

        {/* 選べない行がある理由は、その行の並びの直上に置く */}
        {ownerRowsTotal > 0 && ownerSelectableCount < ownerRowsTotal && (
          <div className="px-4 py-2.5 bg-warn-tint border-b border-border text-[13px] text-ink-2 flex items-start gap-2">
            <AlertCircle size={14} className="text-warn shrink-0 mt-0.5" />
            <span>
              グレーの{ownerRowsTotal - ownerSelectableCount}件は<strong className="font-semibold">口座情報が未登録</strong>のため選べません（{ownersWithoutBank.join("、")}）。
              <Link href="/owners" className="rlink ml-1">オーナー画面で登録する →</Link>
            </span>
          </div>
        )}
        {remittances.length + unconfirmedOwners.length === 0 ? (
          <div className="px-4 py-5 text-[13px] text-ink-3">
            対象のオーナーがいません。理由と対処は下にまとめて表示しています。
          </div>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {/* 確定済みの送金 */}
              {remittances.map((r) => (
                <tr key={r.id} className={rowClass(selRem.has(r.id), r.has_bank)}
                  onClick={() => r.has_bank && toggle(selRem, setSelRem, r.id)}>
                  <td className="px-4 py-3 w-8">
                    <SelectBox checked={selRem.has(r.id)} disabled={!r.has_bank} />
                  </td>
                  <td className={`px-4 py-3 ${selRem.has(r.id) ? "font-semibold" : "font-medium"}`}>{r.owner_name}
                    {!r.has_bank && <span className="text-xs text-danger ml-2">口座情報なし</span>}</td>
                  <td className="px-4 py-3 text-ink-2">{r.remittance_month}</td>
                  <td className={`px-4 py-3 text-right ${selRem.has(r.id) ? "font-semibold text-accent" : "font-medium"}`}>¥{r.amount.toLocaleString()}</td>
                </tr>
              ))}
              {/* 未確定の精算（選ぶと振込データ作成時に自動で確定される） */}
              {unconfirmedOwners.map((o) => (
                <tr key={o.owner_id} className={rowClass(selOwner.has(o.owner_id), o.has_bank)}
                  onClick={() => o.has_bank && toggle(selOwner, setSelOwner, o.owner_id)}>
                  <td className="px-4 py-3 w-8">
                    <SelectBox checked={selOwner.has(o.owner_id)} disabled={!o.has_bank} />
                  </td>
                  <td className={`px-4 py-3 ${selOwner.has(o.owner_id) ? "font-semibold" : "font-medium"}`}>{o.owner_name}
                    {!o.has_bank && <span className="text-xs text-danger ml-2">口座情報なし</span>}</td>
                  <td className="px-4 py-3 text-ink-2">{o.remittance_month}</td>
                  <td className={`px-4 py-3 text-right ${selOwner.has(o.owner_id) ? "font-semibold text-accent" : "font-medium"}`}>¥{o.preview_net_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 業者への費用支払い */}
      {expenses.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-2 text-sm font-semibold flex items-center gap-2">
            業者への費用支払い <span className="text-xs text-ink-3 font-normal">{selExp.size}/{expenses.length}件選択</span>
            {expenseSelectableCount > 0 && (
              <button onClick={toggleAllExpenses} className="ml-auto text-xs rlink font-normal">
                {expenseAllSelected ? "すべて解除" : "すべて選択"}
              </button>
            )}
          </div>
          {/* 選べない行がある理由は、その行の並びの直上に置く（離れた場所だと関連が伝わらない） */}
          {expenseSelectableCount < expenses.length && (
            <div className="px-4 py-2.5 bg-warn-tint border-b border-border text-[13px] text-ink-2 flex items-start gap-2">
              <AlertCircle size={14} className="text-warn shrink-0 mt-0.5" />
              <span>
                グレーの{expenses.length - expenseSelectableCount}件は<strong className="font-semibold">支払先の口座情報が未登録</strong>のため選べません。
                <Link href="/payees" className="rlink ml-1">支払先画面で登録する →</Link>
              </span>
            </div>
          )}
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {expenses.map((e) => {
                const checkable = e.has_bank;
                return (
                  <tr key={e.id} className={rowClass(selExp.has(e.id), checkable)}
                    onClick={() => checkable && toggle(selExp, setSelExp, e.id)}>
                    <td className="px-4 py-3 w-8">
                      <SelectBox checked={selExp.has(e.id)} disabled={!checkable} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={selExp.has(e.id) ? "font-semibold" : "font-medium"}>{e.description}</span>
                      <span className="text-xs text-ink-3 ml-2">{CATEGORY_LABEL[e.category] ?? e.category}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-2" onClick={(ev) => !checkable && ev.stopPropagation()}>
                      {!e.has_payee ? (
                        // 支払先未設定 → その場で選べる
                        <div className="flex items-center gap-2">
                          <select
                            className="input py-1 text-[13px] max-w-[200px]"
                            defaultValue=""
                            disabled={assigningId === e.id}
                            onChange={(ev) => assignPayee(e.id, ev.target.value)}
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            <option value="">支払先を選択…</option>
                            {payees.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}{payeeHasBank(p) ? "" : "（口座未登録）"}
                              </option>
                            ))}
                          </select>
                          {assigningId === e.id && <Loader2 size={13} className="animate-spin text-ink-3" />}
                        </div>
                      ) : (
                        <>
                          {e.payee_name}
                          {!e.has_bank && (
                            <span className="text-xs text-warn ml-2">
                              口座情報なし（
                              <a href="/payees" className="rlink" onClick={(ev) => ev.stopPropagation()}>支払先で登録</a>
                              ）
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-2">{e.expense_date}</td>
                    <td className={`px-4 py-3 text-right ${selExp.has(e.id) ? "font-semibold text-accent" : "font-medium"}`}>¥{e.amount.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {payees.length === 0 && expenses.some((e) => !e.has_payee) && (
            <div className="px-4 py-2 text-xs text-ink-3 border-t border-border">
              支払先がまだ登録されていません。<a href="/payees" className="rlink">支払先</a>を登録すると、ここで選べるようになります。
            </div>
          )}
        </div>
      )}

      <div className="card p-4 space-y-3">
        {/* 押せない理由はボタンの近くに集約する。利用者が最後に見るのはこのボタン。 */}
        {blockers.length > 0 && (
          // 不備（missing）は赤で警告、操作待ち（pending）は通常の案内として出し分ける
          <div
            role={hasMissing ? "alert" : undefined}
            className={hasMissing
              ? "rounded-md border border-danger/40 bg-danger-tint px-4 py-3"
              : "rounded-md border border-border bg-surface-2 px-4 py-3"}
          >
            <div className={hasMissing
              ? "text-sm font-semibold text-danger flex items-center gap-1.5"
              : allDone
                ? "text-sm font-semibold text-accent flex items-center gap-1.5"
                : "text-sm font-medium text-ink-2 flex items-center gap-1.5"}>
              {hasMissing && <AlertCircle size={15} className="shrink-0" />}
              {allDone && <CheckCircle2 size={15} className="shrink-0" />}
              {hasMissing
                ? "振込データを作成できません"
                : allDone
                  ? "この月の振込作業は完了しています"
                  : count > 0
                    ? "補足"
                    : "振込対象を選んでください"}
            </div>
            <ul className="mt-2 space-y-1.5">
              {blockers.map((b, i) => (
                <li key={i} className="text-[13px] text-ink-2 flex gap-2">
                  <span className={b.kind === "missing" || b.kind === undefined ? "text-danger shrink-0" : "text-ink-3 shrink-0"}>・</span>
                  <span>
                    {b.label}
                    {b.link_text && (
                      b.href ? (
                        <Link href={b.href} className="rlink ml-2">{b.link_text} →</Link>
                      ) : (
                        <span className="text-ink-3 ml-2">{b.link_text}</span>
                      )
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-ink-2">
            {count > 0 ? (
              <><span className="font-semibold">{count}件</span> 選択中 / 合計 <span className="font-semibold">¥{total.toLocaleString()}</span></>
            ) : <span className="text-ink-3">振込対象を選択してください</span>}
          </div>
          <div className="space-y-1 text-right">
            {error && <p className="text-danger text-sm">{error}</p>}
            <button onClick={handleCreate} disabled={loading || count === 0}
              className="btn btn-primary disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "作成中…" : "振込データを作成"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
