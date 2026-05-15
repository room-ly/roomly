import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { getInquiryDetail, getPropertiesForSelect, getUnitsForSelect, getTenantsForSelect } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import InquiryDetailClient from "@/components/InquiryDetailClient";

const TYPE_LABELS: Record<string, string> = {
  move_out: "退去",
  complaint: "クレーム",
  other: "その他",
  general: "その他",
};

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, properties, units, tenants] = await Promise.all([
    getInquiryDetail(id),
    getPropertiesForSelect(),
    getUnitsForSelect(),
    getTenantsForSelect(),
  ]);
  if (!result) notFound();

  const { inquiry, logs } = result;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/inquiries"
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          問い合わせ一覧に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{inquiry.title}</h1>
            <p className="text-[13px] text-ink-3 mt-0.5">
              {TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type} — {inquiry.created_at?.slice(0, 10)}
            </p>
          </div>
          <InquiryDetailClient inquiry={inquiry} properties={properties} units={units} tenants={tenants} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ステータスカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">状態</p>
              <StatusBadge status={inquiry.status} />
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">優先度</p>
              <StatusBadge status={inquiry.priority} />
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">種別</p>
              <p className="text-[14px] font-medium">{TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">登録日</p>
              <p className="text-[14px] font-medium">{inquiry.created_at?.slice(0, 10)}</p>
            </div>
          </div>

          {/* 内容 */}
          {inquiry.description && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">内容</h2>
              <p className="text-[13px] whitespace-pre-wrap">{inquiry.description}</p>
            </div>
          )}

          {inquiry.notes && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">備考</h2>
              <p className="text-[13px] whitespace-pre-wrap">{inquiry.notes}</p>
            </div>
          )}

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
          {inquiry.property && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">物件情報</h2>
              <div className="space-y-3 text-[13px]">
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">物件</p>
                  <Link href={`/properties/${inquiry.property.id}`} className="text-accent hover:underline">
                    {inquiry.property.name}
                  </Link>
                </div>
                {inquiry.unit?.unit_number && (
                  <div>
                    <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">部屋</p>
                    <p>{inquiry.unit.unit_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {inquiry.tenant && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">入居者情報</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">氏名</p>
                  <p className="text-[14px] font-medium">{inquiry.tenant.name}</p>
                </div>
                {inquiry.tenant.phone && (
                  <div>
                    <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">電話番号</p>
                    <a href={`tel:${inquiry.tenant.phone}`} className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline">
                      <Phone size={13} />
                      {inquiry.tenant.phone}
                    </a>
                  </div>
                )}
                {inquiry.tenant.email && (
                  <div>
                    <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">メール</p>
                    <a href={`mailto:${inquiry.tenant.email}`} className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline">
                      <Mail size={13} />
                      {inquiry.tenant.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
