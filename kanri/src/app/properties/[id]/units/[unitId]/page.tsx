import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { getUnitDetail } from "@/lib/queries";
import UnitDetailClient from "@/components/UnitDetailClient";
import PropertyImages from "@/components/PropertyImages";

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
      <div className="mb-4">
        <Link
          href={`/properties/${id}`}
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          {unit.property?.name || "物件詳細"}に戻る
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold truncate">{unit.unit_number}号室</h1>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${s.cls}`}
              >
                {s.text}
              </span>
            </div>
            {unit.property?.address && (
              <p className="flex items-center gap-1 text-[13px] text-ink-3 mt-0.5">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{unit.property.address}</span>
              </p>
            )}
          </div>
          <UnitDetailClient propertyId={id} unit={unit} activeContract={activeContract ?? null} />
        </div>
      </div>

      <PropertyImages propertyId={id} unitId={unitId} />

      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-line">
          <h2 className="text-[13px] font-semibold">基本情報</h2>
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3 p-5 text-[13px]">
          <div>
            <p className="text-ink-3 mb-0.5">階</p>
            <p className="font-medium">{unit.floor ? `${unit.floor}F` : "—"}</p>
          </div>
          <div>
            <p className="text-ink-3 mb-0.5">間取り</p>
            <p className="font-medium">{unit.layout || "—"}</p>
          </div>
          <div>
            <p className="text-ink-3 mb-0.5">面積</p>
            <p className="font-medium">{unit.area_sqm ? `${Number(unit.area_sqm)}m²` : "—"}</p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-b border-line">
          <h2 className="text-[13px] font-semibold">賃料・費用</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 p-5 text-[13px]">
          <div>
            <p className="text-ink-3 mb-0.5">賃料</p>
            <p className="font-medium tabular-nums">¥{Number(unit.rent).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-ink-3 mb-0.5">管理費</p>
            <p className="font-medium tabular-nums">¥{Number(unit.management_fee).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-ink-3 mb-0.5">敷金</p>
            <p className="font-medium tabular-nums">¥{Number(unit.deposit || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-ink-3 mb-0.5">礼金</p>
            <p className="font-medium tabular-nums">¥{Number(unit.key_money || 0).toLocaleString()}</p>
          </div>
        </div>

        {((unit.equipment && unit.equipment.length > 0) || unit.notes) && (
          <>
            <div className="px-5 py-3 border-t border-b border-line">
              <h2 className="text-[13px] font-semibold">設備・備考</h2>
            </div>
            <div className="p-5 text-[13px]">
              {unit.equipment && unit.equipment.length > 0 && (
                <div className="mb-3 last:mb-0">
                  <p className="text-ink-3 mb-1.5">設備</p>
                  <div className="flex flex-wrap gap-1.5">
                    {unit.equipment.map((eq: string) => (
                      <span key={eq} className="inline-block bg-bg-2 text-ink-2 px-2.5 py-0.5 rounded-full text-[12px]">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {unit.notes && (
                <div>
                  <p className="text-ink-3 mb-1">備考</p>
                  <p className="text-ink whitespace-pre-wrap">{unit.notes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {activeContract && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-line">
            <h2 className="text-[13px] font-semibold">現在の契約</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
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
