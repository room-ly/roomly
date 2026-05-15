"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

const statusConfig: Record<string, { text: string; cls: string }> = {
  pending: { text: "申請中", cls: "bg-warn-tint text-warn" },
  approved: { text: "承認済", cls: "bg-accent-tint text-accent-deep" },
  rejected: { text: "却下", cls: "bg-danger-tint text-danger" },
  completed: { text: "完了", cls: "bg-bg-2 text-ink-3" },
};

export default function MoveOutReviewClient({ request }: { request: Record<string, any> }) {
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleAction(status: "approved" | "rejected") {
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
      <div className="flex gap-2">
        <button
          onClick={() => handleAction("approved")}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-accent text-white rounded-lg text-[13px] font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
        >
          <Check size={14} />
          承認
        </button>
        <button
          onClick={() => handleAction("rejected")}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-danger-tint text-danger rounded-lg text-[13px] font-medium hover:bg-danger/10 transition-colors disabled:opacity-50"
        >
          <X size={14} />
          却下
        </button>
      </div>
    </div>
  );
}
