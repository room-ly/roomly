"use client";

import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface InquiriesTableProps {
  inquiries: Record<string, any>[];
}

export default function InquiriesTable({ inquiries }: InquiriesTableProps) {
  const router = useRouter();

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "closed" ? "open" : "closed";
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-text-muted border-b border-border-light">
              <th className="px-5 py-2.5 font-medium w-10"></th>
              <th className="px-5 py-2.5 font-medium">件名</th>
              <th className="px-5 py-2.5 font-medium">種別</th>
              <th className="px-5 py-2.5 font-medium">優先度</th>
              <th className="px-5 py-2.5 font-medium">状態</th>
              <th className="px-5 py-2.5 font-medium">登録日</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inq) => {
              const isClosed = inq.status === "closed";
              return (
                <tr
                  key={inq.id}
                  className={`border-b border-border-light last:border-0 hover:bg-bg-secondary/30 transition-colors ${isClosed ? "opacity-50" : ""}`}
                >
                  <td className="px-5 py-2.5">
                    <button
                      onClick={() => toggleStatus(inq.id, inq.status)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isClosed
                          ? "border-success bg-success text-white"
                          : "border-border-light hover:border-accent"
                      }`}
                      title={isClosed ? "未対応に戻す" : "完了にする"}
                    >
                      {isClosed ? <Check size={12} /> : null}
                    </button>
                  </td>
                  <td className={`px-5 py-2.5 font-medium ${isClosed ? "line-through" : ""}`}>
                    {inq.title}
                  </td>
                  <td className="px-5 py-2.5"><StatusBadge status={inq.inquiry_type} /></td>
                  <td className="px-5 py-2.5"><StatusBadge status={inq.priority} /></td>
                  <td className="px-5 py-2.5"><StatusBadge status={inq.status} /></td>
                  <td className="px-5 py-2.5">{inq.created_at?.slice(0, 10)}</td>
                </tr>
              );
            })}
            {inquiries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-text-muted">
                  問い合わせはありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
