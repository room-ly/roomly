"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

const statusConfig: Record<string, { text: string; cls: string }> = {
  pending: { text: "申請中", cls: "bg-warn-tint text-warn" },
  approved: { text: "確認済", cls: "bg-accent-tint text-accent-deep" },
  completed: { text: "完了", cls: "bg-bg-2 text-ink-3" },
};

export default function MoveOutReviewClient({ request }: { request: Record<string, any> }) {
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleAction(status: "approved") {
    setProcessing(true);
    const res = await fetch(`/api/move-out-requests/${request.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, review_notes: reviewNotes }),
    });
    if (res.ok) {
      setReviewNotes("");
      router.refresh();
    }
    setProcessing(false);
  }

  if (request.status !== "pending") {
    const s = statusConfig[request.status] ?? statusConfig.pending;
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}>
        {s.text}
      </span>
    );
  }

  return (
    <div className="space-y-3 pt-3 border-t border-line">
      <div>
        <label className="block text-[13px] text-ink-3 mb-1">備考（入居者に通知されません）</label>
        <textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-[13px] border border-line rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
        />
      </div>
      <button
        onClick={() => handleAction("approved")}
        disabled={processing}
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-accent text-white rounded-lg text-[13px] font-medium hover:bg-accent-deep transition-colors disabled:opacity-50 disabled:cursor-wait"
      >
        {processing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {processing ? "処理中..." : "確認済みにする"}
      </button>
    </div>
  );
}
