"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchAuditLogRefresh } from "@/lib/audit-events";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  billingId: string;
  billingMonth: string;
  // 現在のDB上のstatus（"exempt" なら対象外）
  status: string | null | undefined;
  // 入金がある場合は対象外にできない（誤操作で入金履歴が宙に浮くのを防ぐ）
  hasPayments: boolean;
}

// フリーレント月・入居前後の月など「家賃が発生しない月」を
// 未納・回収率の集計から外すためのトグル。
// 対象外にすると未納としてカウントされなくなる。
export default function BillingExemptToggle({
  billingId,
  billingMonth,
  status,
  hasPayments,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // 確認モーダルで実行予定のアクション（null なら閉じている）
  const [pending, setPending] = useState<"exempt" | "unpaid" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isExempt = status === "exempt";
  const monthLabel = billingMonth?.slice(0, 7) ?? "この月";

  const confirm = async () => {
    if (busy || !pending) return;
    const next = pending;
    setBusy(true);
    try {
      const res = await fetch(`/api/rent-billings/${billingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "更新に失敗しました");
        return;
      }
      setPending(null);
      router.refresh();
      dispatchAuditLogRefresh();
    } finally {
      setBusy(false);
    }
  };

  const dialog = (
    <>
      <ConfirmDialog
        isOpen={pending !== null}
        title={
          pending === "exempt"
            ? `${monthLabel} を対象外にする`
            : `${monthLabel} の対象外を解除`
        }
        message={
          pending === "exempt"
            ? "未納・滞納や回収率の集計から外れます。よろしいですか？"
            : "通常どおり未納・入金の集計対象に戻ります。よろしいですか？"
        }
        confirmLabel={pending === "exempt" ? "対象外にする" : "解除する"}
        variant="neutral"
        loading={busy}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        isOpen={error !== null}
        title="更新に失敗しました"
        message={error ?? ""}
        confirmLabel="閉じる"
        onConfirm={() => setError(null)}
        onCancel={() => setError(null)}
      />
    </>
  );

  if (isExempt) {
    return (
      <>
        <button
          type="button"
          className="rlink"
          style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}
          disabled={busy}
          onClick={() => setPending("unpaid")}
        >
          対象外を解除
        </button>
        {dialog}
      </>
    );
  }

  // 入金記録があるものは対象外にさせない
  if (hasPayments) return null;

  return (
    <>
      <button
        type="button"
        className="rlink"
        style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}
        disabled={busy}
        onClick={() => setPending("exempt")}
        title="フリーレント月や入居前後の月など、家賃が発生しない月を集計から外します"
      >
        対象外にする
      </button>
      {dialog}
    </>
  );
}
