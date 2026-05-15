"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Check, X, Eye } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const statusConfig: Record<string, { text: string; cls: string }> = {
  pending: { text: "申請中", cls: "bg-warn-tint text-warn" },
  approved: { text: "承認済", cls: "bg-accent-tint text-accent-deep" },
  rejected: { text: "却下", cls: "bg-danger-tint text-danger" },
  completed: { text: "完了", cls: "bg-bg-2 text-ink-3" },
};

export default function MoveOutRequestsPageClient({
  requests,
}: {
  requests: any[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const selected = requests.find((r: any) => r.id === selectedId);

  async function handleAction(id: string, status: "approved" | "rejected") {
    setProcessing(true);
    const res = await fetch(`/api/move-out-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, review_notes: reviewNotes }),
    });

    if (res.ok) {
      setSelectedId(null);
      setReviewNotes("");
      router.refresh();
    }
    setProcessing(false);
  }

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">退去申請</h1>
          <p className="text-[13px] text-ink-3 mt-0.5">
            入居者からの退去申請を管理します
            {pendingCount > 0 && (
              <span className="ml-2 text-warn font-medium">
                {pendingCount}件の未処理
              </span>
            )}
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card p-12 text-center text-ink-3 text-[13px]">
          <FileText size={24} className="mx-auto mb-2 text-ink-4" />
          退去申請はありません
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ink-3 border-b border-line">
                <th className="px-5 py-2.5 font-medium">入居者</th>
                <th className="px-5 py-2.5 font-medium">物件・部屋</th>
                <th className="px-5 py-2.5 font-medium">退去希望日</th>
                <th className="px-5 py-2.5 font-medium">申請日</th>
                <th className="px-5 py-2.5 font-medium">ステータス</th>
                <th className="px-5 py-2.5 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req: any) => {
                const s = statusConfig[req.status] ?? statusConfig.pending;
                const unit = req.contract?.unit;
                return (
                  <tr
                    key={req.id}
                    className="border-b border-line last:border-0 hover:bg-surface-tint transition-colors"
                  >
                    <td className="px-5 py-2.5 font-medium">
                      {req.tenant?.name ?? "—"}
                    </td>
                    <td className="px-5 py-2.5">
                      {unit?.property?.name ?? "—"}{" "}
                      {unit?.unit_number ? `${unit.unit_number}号室` : ""}
                    </td>
                    <td className="px-5 py-2.5">{req.desired_move_out_date}</td>
                    <td className="px-5 py-2.5">
                      {req.created_at?.slice(0, 10)}
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}
                      >
                        {s.text}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedId(req.id);
                          setReviewNotes("");
                        }}
                        className="inline-flex items-center gap-1 text-accent hover:text-accent-deep transition-colors"
                      >
                        <Eye size={14} />
                        詳細
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 詳細モーダル */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedId(null)}
          />
          <div className="relative bg-surface rounded-2xl shadow-xl border border-line w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface px-5 py-3 border-b border-line flex items-center justify-between rounded-t-2xl">
              <h2 className="text-[15px] font-semibold">退去申請の詳細</h2>
              <button
                onClick={() => setSelectedId(null)}
                className="text-ink-3 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-ink-3 mb-0.5">入居者</p>
                  <p className="font-medium">{selected.tenant?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-ink-3 mb-0.5">連絡先</p>
                  <p className="font-medium">{selected.tenant?.phone ?? "—"}</p>
                  <p className="text-ink-3">{selected.tenant?.email ?? ""}</p>
                </div>
                <div>
                  <p className="text-ink-3 mb-0.5">物件</p>
                  <p className="font-medium">
                    {selected.contract?.unit?.property?.name ?? "—"}{" "}
                    {selected.contract?.unit?.unit_number
                      ? `${selected.contract.unit.unit_number}号室`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-ink-3 mb-0.5">退去希望日</p>
                  <p className="font-medium">
                    {selected.desired_move_out_date}
                  </p>
                </div>
              </div>

              {selected.reason && (
                <div>
                  <p className="text-ink-3 mb-0.5">退去理由</p>
                  <p className="whitespace-pre-wrap">{selected.reason}</p>
                </div>
              )}

              {(selected.forwarding_address || selected.forwarding_phone) && (
                <div>
                  <p className="text-ink-3 mb-0.5">転居先</p>
                  {selected.forwarding_postal_code && (
                    <p>〒{selected.forwarding_postal_code}</p>
                  )}
                  {selected.forwarding_address && (
                    <p>{selected.forwarding_address}</p>
                  )}
                  {selected.forwarding_phone && (
                    <p>TEL: {selected.forwarding_phone}</p>
                  )}
                </div>
              )}

              {selected.bank_name && (
                <div>
                  <p className="text-ink-3 mb-0.5">敷金返還先口座</p>
                  <p>
                    {selected.bank_name} {selected.bank_branch}{" "}
                    {selected.bank_account_type} {selected.bank_account_number}
                  </p>
                  <p>名義: {selected.bank_account_holder}</p>
                </div>
              )}

              {selected.status === "pending" && (
                <div className="pt-2 border-t border-line space-y-3">
                  <div>
                    <label className="block text-ink-3 mb-1">
                      備考（入居者に通知されません）
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-[13px] border border-line rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(selected.id, "approved")}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-accent text-white rounded-lg text-[13px] font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
                    >
                      <Check size={14} />
                      承認
                    </button>
                    <button
                      onClick={() => handleAction(selected.id, "rejected")}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-danger-tint text-danger rounded-lg text-[13px] font-medium hover:bg-danger/10 transition-colors disabled:opacity-50"
                    >
                      <X size={14} />
                      却下
                    </button>
                  </div>
                </div>
              )}

              {selected.status !== "pending" && selected.review_notes && (
                <div>
                  <p className="text-ink-3 mb-0.5">レビュー備考</p>
                  <p className="whitespace-pre-wrap">{selected.review_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
