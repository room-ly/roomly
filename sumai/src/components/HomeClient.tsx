"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Home,
  LogOut,
  FileText,
  Wrench,
  Key,
  Building2,
  Calendar,
  Clock,
  ChevronRight,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface HomeClientProps {
  contract: any | null;
  moveOutRequests: any[];
  maintenanceRequests: any[];
  companyName: string;
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  pending: { text: "申請中", cls: "bg-warn-tint text-warn" },
  approved: { text: "承認済", cls: "bg-success-tint text-success" },
  rejected: { text: "却下", cls: "bg-danger-tint text-danger" },
  completed: { text: "完了", cls: "bg-bg-2 text-ink-3" },
};

const maintenanceStatusLabel: Record<string, { text: string; cls: string }> = {
  open: { text: "未対応", cls: "bg-warn-tint text-warn" },
  in_progress: { text: "対応中", cls: "bg-accent-tint text-accent" },
  completed: { text: "完了", cls: "bg-success-tint text-success" },
  cancelled: { text: "取消", cls: "bg-bg-2 text-ink-3" },
};

export default function HomeClient({
  contract,
  moveOutRequests,
  maintenanceRequests,
  companyName,
}: HomeClientProps) {
  const { user, logout } = useAuth();
  const pendingMoveOut = moveOutRequests.find((r: any) => r.status === "pending" || r.status === "approved");
  const hasPendingMoveOut = !!pendingMoveOut;

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="bg-surface border-b border-line px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-accent text-white grid place-items-center text-sm font-bold">R</span>
            <span className="font-semibold text-sm">Roomly</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs text-ink-3 hover:text-ink transition-colors"
          >
            <LogOut size={14} />
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* 挨拶 */}
        <div>
          <h1 className="text-lg font-bold">
            {user?.name ?? "入居者"}さん
          </h1>
          <p className="text-sm text-ink-3">{companyName}管理</p>
        </div>

        {/* 契約情報カード */}
        {contract ? (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-accent" />
              <h2 className="text-sm font-semibold">契約情報</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-3">物件名</span>
                <span className="font-medium">{contract.unit?.property?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">部屋番号</span>
                <span className="font-medium">{contract.unit?.unit_number ?? "—"}号室</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">所在地</span>
                <span className="font-medium text-right text-xs max-w-[200px]">{contract.unit?.property?.address ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">契約期間</span>
                <span className="font-medium text-xs">
                  {contract.start_date ?? "—"} 〜 {contract.end_date ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">月額賃料</span>
                <span className="font-medium">
                  ¥{Number(contract.rent ?? 0).toLocaleString()}
                  {contract.management_fee ? ` + ¥${Number(contract.management_fee).toLocaleString()}` : ""}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-5 text-center text-sm text-ink-3">
            <Home size={24} className="mx-auto mb-2 text-ink-4" />
            有効な契約が見つかりません
          </div>
        )}

        {/* アクションボタン */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href={hasPendingMoveOut ? "#" : "/move-out"}
            className={`card p-4 flex flex-col items-center gap-2 transition-colors ${
              hasPendingMoveOut
                ? "opacity-50 pointer-events-none"
                : "hover:border-accent/30 active:bg-bg-2"
            }`}
          >
            <FileText size={24} className="text-accent" />
            <span className="text-sm font-medium">退去申請</span>
            {hasPendingMoveOut && (
              <span className="text-xs text-warn">申請済み</span>
            )}
          </Link>
          <Link
            href="/maintenance"
            className="card p-4 flex flex-col items-center gap-2 hover:border-accent/30 active:bg-bg-2 transition-colors"
          >
            <Wrench size={24} className="text-accent" />
            <span className="text-sm font-medium">修理依頼</span>
          </Link>
          <Link
            href="/lost-key"
            className="card p-4 flex flex-col items-center gap-2 hover:border-warn/30 active:bg-bg-2 transition-colors"
          >
            <Key size={24} className="text-warn" />
            <span className="text-sm font-medium">鍵紛失</span>
          </Link>
        </div>

        {/* 退去申請履歴 */}
        {moveOutRequests.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Calendar size={14} className="text-ink-3" />
                退去申請
              </h2>
            </div>
            {moveOutRequests.map((req: any) => {
              const s = statusLabel[req.status] ?? statusLabel.pending;
              return (
                <div key={req.id} className="px-4 py-3 border-b border-line last:border-0 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">退去希望日: {req.desired_move_out_date}</p>
                    <p className="text-xs text-ink-3 mt-0.5">申請日: {req.created_at?.slice(0, 10)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
                    {s.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 修理依頼履歴 */}
        {maintenanceRequests.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Clock size={14} className="text-ink-3" />
                修理依頼
              </h2>
              <Link href="/maintenance" className="text-xs text-accent flex items-center gap-0.5">
                すべて見る <ChevronRight size={12} />
              </Link>
            </div>
            {maintenanceRequests.slice(0, 3).map((req: any) => {
              const s = maintenanceStatusLabel[req.status] ?? maintenanceStatusLabel.open;
              return (
                <div key={req.id} className="px-4 py-3 border-b border-line last:border-0 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{req.title}</p>
                    <p className="text-xs text-ink-3 mt-0.5">{req.reported_date}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${s.cls}`}>
                    {s.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
