import { notFound } from "next/navigation";
import Link from "next/link";
import { getMaintenanceDetail, getPropertiesForSelect } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
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
      <div className="detail-back">
        <Link href="/maintenance" className="rlink is-muted is-back">← 修繕一覧に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{request.title}</h1>
            <div className="detail-kana">
              {request.property?.name}{request.unit?.unit_number ? ` ${request.unit.unit_number}` : " 共用部"}
            </div>
          </div>
          <div style={{ marginLeft: 8, display: "flex", gap: 6 }}>
            <StatusBadge status={request.status} />
            <StatusBadge status={request.priority} />
          </div>
        </div>
        <div className="detail-header-actions">
          <MaintenanceDetailClient request={request} properties={properties} />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 概要 */}
          <div className="section">
            <div className="section-head-bar"><h2>基本情報</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">状態</div>
                  <div className="field-value"><StatusBadge status={request.status} /></div>
                </div>
                <div className="field">
                  <div className="field-label mono">優先度</div>
                  <div className="field-value"><StatusBadge status={request.priority} /></div>
                </div>
                <div className="field">
                  <div className="field-label mono">カテゴリ</div>
                  <div className="field-value field-plain">{categoryLabels[request.category] || request.category}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">報告日</div>
                  <div className="field-value field-plain mono">{request.reported_date}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 費用・業者 */}
          {(request.vendor_name || request.estimated_cost != null || request.actual_cost != null || request.scheduled_date || request.completed_date) && (
            <div className="section">
              <div className="section-head-bar"><h2>費用・業者情報</h2></div>
              <div className="section-body">
                <div className="kv-grid">
                  {request.vendor_name && (
                    <div className="field">
                      <div className="field-label mono">業者</div>
                      <div className="field-value field-plain">{request.vendor_name}</div>
                    </div>
                  )}
                  {request.vendor_phone && (
                    <div className="field">
                      <div className="field-label mono">業者連絡先</div>
                      <div className="field-value field-plain mono">{formatPhone(request.vendor_phone)}</div>
                    </div>
                  )}
                  {request.estimated_cost != null && (
                    <div className="field">
                      <div className="field-label mono">見積金額</div>
                      <div className="field-value num">¥{Number(request.estimated_cost).toLocaleString()}</div>
                    </div>
                  )}
                  {request.actual_cost != null && (
                    <div className="field">
                      <div className="field-label mono">実費</div>
                      <div className="field-value num">¥{Number(request.actual_cost).toLocaleString()}</div>
                    </div>
                  )}
                  {request.scheduled_date && (
                    <div className="field">
                      <div className="field-label mono">作業予定日</div>
                      <div className="field-value field-plain mono">{request.scheduled_date}</div>
                    </div>
                  )}
                  {request.completed_date && (
                    <div className="field">
                      <div className="field-label mono">完了日</div>
                      <div className="field-value field-plain mono">{request.completed_date}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 説明・備考 */}
          {(request.description || request.notes) && (
            <div className="section">
              <div className="section-head-bar"><h2>詳細</h2></div>
              <div className="section-body">
                {request.description && (
                  <div style={{ marginBottom: request.notes ? 16 : 0 }}>
                    <span className="field-label mono">説明</span>
                    <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{request.description}</p>
                  </div>
                )}
                {request.notes && (
                  <div style={{ paddingTop: request.description ? 16 : 0, borderTop: request.description ? "1px solid var(--line)" : "none" }}>
                    <span className="field-label mono">備考</span>
                    <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{request.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 対応履歴 */}
          {logs.length > 0 && (
            <div className="section">
              <div className="section-head-bar">
                <h2>対応履歴</h2>
                <span className="desc">{logs.length}件</span>
              </div>
              <div className="section-body flush">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>日時</th>
                      <th>種別</th>
                      <th>内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => (
                      <tr key={log.id} className="row-hover">
                        <td className="mono" style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                          {log.created_at?.slice(0, 16).replace("T", " ")}
                        </td>
                        <td>{log.action_type && <StatusBadge status={log.action_type} />}</td>
                        <td style={{ whiteSpace: "pre-wrap" }}>{log.content}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          <div className="section">
            <div className="section-head-bar"><h2>物件情報</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">物件</div>
                  <div className="field-value">
                    <Link href={`/properties/${request.property?.id}`} className="rlink">
                      {request.property?.name || "—"}
                    </Link>
                  </div>
                </div>
                {request.property?.address && (
                  <div className="field">
                    <div className="field-label mono">住所</div>
                    <div className="field-value field-plain" style={{ fontSize: 12 }}>{request.property.address}</div>
                  </div>
                )}
                <div className="field">
                  <div className="field-label mono">部屋</div>
                  <div className="field-value field-plain mono">{request.unit?.unit_number || "共用部"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-head-bar"><h2>関連</h2></div>
            <div className="section-body">
              <div className="related-list">
                {request.property?.id && (
                  <Link href={`/properties/${request.property.id}`} className="related-row">
                    <div>
                      <div className="related-label">物件詳細</div>
                      <div className="related-sub">{request.property.name}</div>
                    </div>
                    <span className="related-arrow">↗</span>
                  </Link>
                )}
                <Link href="/expenses" className="related-row">
                  <div>
                    <div className="related-label">経費管理</div>
                    <div className="related-sub">修繕費の経費登録</div>
                  </div>
                  <span className="related-arrow">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
