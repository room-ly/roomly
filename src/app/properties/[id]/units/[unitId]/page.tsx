import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { getUnitDetail } from "@/lib/queries";
import UnitDetailClient from "@/components/UnitDetailClient";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const result = await getUnitDetail(unitId);
  if (!result || result.unit.property_id !== id) notFound();

  const { unit, contracts, maintenanceRequests } = result;
  const activeContract = contracts.find((c: any) => c.status === "active");

  const statusLabel: Record<string, { text: string; cls: string }> = {
    occupied: { text: "入居中", cls: "bg-accent-tint text-accent-deep" },
    vacant: { text: "空室", cls: "bg-accent-tint text-accent" },
    reserved: { text: "申込中", cls: "bg-warn-tint text-warn" },
    maintenance: { text: "メンテ中", cls: "bg-bg-2 text-ink-3" },
  };
  const s = statusLabel[unit.status] || statusLabel.maintenance;

  return (
    <>
      <div className="mb-6">
        <Link
          href={`/properties/${id}`}
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          {unit.property?.name || "物件詳細"}に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{unit.unit_number}号室</h1>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}
              >
                {s.text}
              </span>
            </div>
            {unit.property?.address && (
              <p className="flex items-center gap-1 text-[13px] text-ink-3 mt-0.5">
                <MapPin size={12} />
                {unit.property.address}
              </p>
            )}
          </div>
          <UnitDetailClient
            propertyId={id}
            unit={unit}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "階", value: unit.floor ? `${unit.floor}F` : "—" },
          { label: "間取り", value: unit.layout || "—" },
          {
            label: "面積",
            value: unit.area_sqm ? `${Number(unit.area_sqm)}m²` : "—",
          },
          {
            label: "賃料 / 管理費",
            value: `¥${Number(unit.rent).toLocaleString()} / ¥${Number(unit.management_fee).toLocaleString()}`,
          },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">
              {item.label}
            </p>
            <p className="text-[14px] font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      {activeContract && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-line">
            <h2 className="text-[13px] font-semibold">現在の契約</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
              <div>
                <p className="text-ink-3 mb-1">入居者</p>
                <p className="font-medium">
                  {activeContract.tenant?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-ink-3 mb-1">電話番号</p>
                <p className="font-medium">
                  {activeContract.tenant?.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-ink-3 mb-1">契約開始</p>
                <p className="font-medium">
                  {activeContract.start_date || "—"}
                </p>
              </div>
              <div>
                <p className="text-ink-3 mb-1">契約終了</p>
                <p className="font-medium">
                  {activeContract.end_date || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {contracts.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-line">
            <h2 className="text-[13px] font-semibold">
              契約履歴（{contracts.length}件）
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-ink-3 border-b border-line">
                  <th className="px-5 py-2.5 font-medium">入居者</th>
                  <th className="px-5 py-2.5 font-medium">開始日</th>
                  <th className="px-5 py-2.5 font-medium">終了日</th>
                  <th className="px-5 py-2.5 font-medium text-right">賃料</th>
                  <th className="px-5 py-2.5 font-medium">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c: any) => {
                  const contractStatus: Record<
                    string,
                    { text: string; cls: string }
                  > = {
                    active: {
                      text: "有効",
                      cls: "bg-accent-tint text-accent-deep",
                    },
                    expired: { text: "満了", cls: "bg-bg-2 text-ink-3" },
                    terminated: {
                      text: "解約",
                      cls: "bg-danger-tint text-danger",
                    },
                  };
                  const cs = contractStatus[c.status] ||
                    contractStatus.expired;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-5 py-2.5 font-medium">
                        {c.tenant?.name || "—"}
                      </td>
                      <td className="px-5 py-2.5">{c.start_date || "—"}</td>
                      <td className="px-5 py-2.5">{c.end_date || "—"}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">
                        {c.rent ? `¥${Number(c.rent).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${cs.cls}`}
                        >
                          {cs.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {maintenanceRequests.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-line">
            <h2 className="text-[13px] font-semibold">
              修繕履歴（直近{maintenanceRequests.length}件）
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-ink-3 border-b border-line">
                  <th className="px-5 py-2.5 font-medium">報告日</th>
                  <th className="px-5 py-2.5 font-medium">タイトル</th>
                  <th className="px-5 py-2.5 font-medium">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRequests.map((m: any) => {
                  const mStatus: Record<
                    string,
                    { text: string; cls: string }
                  > = {
                    open: { text: "未対応", cls: "bg-warn-tint text-warn" },
                    in_progress: {
                      text: "対応中",
                      cls: "bg-accent-tint text-accent",
                    },
                    completed: {
                      text: "完了",
                      cls: "bg-accent-tint text-accent-deep",
                    },
                    cancelled: { text: "取消", cls: "bg-bg-2 text-ink-3" },
                  };
                  const ms = mStatus[m.status] || mStatus.open;
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-5 py-2.5">{m.reported_date || "—"}</td>
                      <td className="px-5 py-2.5 font-medium">
                        {m.title || "—"}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${ms.cls}`}
                        >
                          {ms.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
