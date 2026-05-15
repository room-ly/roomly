import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMaintenanceDetail, getPropertiesForSelect } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import MaintenanceDetailClient from "@/components/MaintenanceDetailClient";

const categoryLabels: Record<string, string> = {
  plumbing: "水回り",
  electrical: "電気",
  structural: "構造",
  equipment: "設備",
  other: "その他",
};

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, properties] = await Promise.all([
    getMaintenanceDetail(id),
    getPropertiesForSelect(),
  ]);
  if (!result) notFound();

  const { request, logs } = result;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/maintenance"
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          修繕一覧に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{request.title}</h1>
            <p className="text-[13px] text-ink-3 mt-0.5">
              {request.property?.name}{request.unit?.unit_number ? ` ${request.unit.unit_number}` : " 共用部"}
            </p>
          </div>
          <MaintenanceDetailClient request={request} properties={properties} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ステータスカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">状態</p>
              <StatusBadge status={request.status} />
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">優先度</p>
              <StatusBadge status={request.priority} />
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">カテゴリ</p>
              <p className="text-[14px] font-medium">{categoryLabels[request.category] || request.category}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">報告日</p>
              <p className="text-[14px] font-medium">{request.reported_date}</p>
            </div>
          </div>

          {/* 詳細 */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">修繕内容</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              {request.vendor_name && (
                <div>
                  <span className="text-ink-3">業者</span>
                  <p className="font-medium">{request.vendor_name}</p>
                </div>
              )}
              {request.vendor_phone && (
                <div>
                  <span className="text-ink-3">業者連絡先</span>
                  <p className="font-medium">{request.vendor_phone}</p>
                </div>
              )}
              {request.estimated_cost != null && (
                <div>
                  <span className="text-ink-3">見積金額</span>
                  <p className="font-medium tabular-nums">¥{Number(request.estimated_cost).toLocaleString()}</p>
                </div>
              )}
              {request.actual_cost != null && (
                <div>
                  <span className="text-ink-3">実費</span>
                  <p className="font-medium tabular-nums">¥{Number(request.actual_cost).toLocaleString()}</p>
                </div>
              )}
              {request.scheduled_date && (
                <div>
                  <span className="text-ink-3">作業予定日</span>
                  <p className="font-medium">{request.scheduled_date}</p>
                </div>
              )}
              {request.completed_date && (
                <div>
                  <span className="text-ink-3">完了日</span>
                  <p className="font-medium">{request.completed_date}</p>
                </div>
              )}
            </div>
            {request.description && (
              <div className="mt-4 pt-4 border-t border-line">
                <span className="text-[11px] text-ink-3">説明</span>
                <p className="text-[13px] mt-1 whitespace-pre-wrap">{request.description}</p>
              </div>
            )}
            {request.notes && (
              <div className="mt-4 pt-4 border-t border-line">
                <span className="text-[11px] text-ink-3">備考</span>
                <p className="text-[13px] mt-1 whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
          </div>

          {/* 対応履歴 */}
          {logs.length > 0 && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">対応履歴</h2>
              <div className="space-y-3">
                {logs.map((log: any) => (
                  <div key={log.id} className="border-b border-line last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-ink-3">{log.created_at?.slice(0, 16).replace("T", " ")}</span>
                      {log.action_type && <StatusBadge status={log.action_type} />}
                    </div>
                    <p className="text-[13px] whitespace-pre-wrap">{log.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">物件情報</h2>
            <div className="space-y-3 text-[13px]">
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">物件</p>
                <Link href={`/properties/${request.property?.id}`} className="text-accent hover:underline">
                  {request.property?.name || "—"}
                </Link>
              </div>
              {request.property?.address && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">住所</p>
                  <p className="text-ink-2">{request.property.address}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">部屋</p>
                <p>{request.unit?.unit_number || "共用部"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
