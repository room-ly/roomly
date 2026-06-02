"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchAuditLogRefresh } from "@/lib/audit-events";

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
  const isExempt = status === "exempt";

  const apply = async (next: "exempt" | "unpaid") => {
    if (busy) return;
    const monthLabel = billingMonth?.slice(0, 7) ?? "この月";
    const msg =
      next === "exempt"
        ? `${monthLabel} を「対象外」にします。\n未納・滞納や回収率の集計から外れます。よろしいですか？`
        : `${monthLabel} の「対象外」を解除します。\n通常どおり未納・入金の集計対象に戻ります。よろしいですか？`;
    if (!window.confirm(msg)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/rent-billings/${billingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || "更新に失敗しました");
        return;
      }
      router.refresh();
      dispatchAuditLogRefresh();
    } finally {
      setBusy(false);
    }
  };

  if (isExempt) {
    return (
      <button
        type="button"
        className="rlink"
        style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}
        disabled={busy}
        onClick={() => apply("unpaid")}
      >
        対象外を解除
      </button>
    );
  }

  // 入金記録があるものは対象外にさせない
  if (hasPayments) return null;

  return (
    <button
      type="button"
      className="rlink"
      style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}
      disabled={busy}
      onClick={() => apply("exempt")}
      title="フリーレント月や入居前後の月など、家賃が発生しない月を集計から外します"
    >
      対象外にする
    </button>
  );
}
