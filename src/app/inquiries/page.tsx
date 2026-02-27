import { Plus } from "lucide-react";
import { inquiries } from "@/lib/mock-data";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

export default function InquiriesPage() {
  return (
    <>
      <PageHeader
        title="問い合わせ管理"
        description={`${inquiries.length}件の問い合わせ`}
        action={
          <button className="btn-primary">
            <Plus size={16} />
            問い合わせを登録
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted bg-bg-secondary/50">
                <th className="px-5 py-3 font-medium">件名</th>
                <th className="px-5 py-3 font-medium">種別</th>
                <th className="px-5 py-3 font-medium">優先度</th>
                <th className="px-5 py-3 font-medium">状態</th>
                <th className="px-5 py-3 font-medium">登録日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-5 py-3 font-medium">{inq.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={inq.inquiry_type} /></td>
                  <td className="px-5 py-3"><StatusBadge status={inq.priority} /></td>
                  <td className="px-5 py-3"><StatusBadge status={inq.status} /></td>
                  <td className="px-5 py-3">{inq.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
